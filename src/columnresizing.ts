import { Attrs, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { TableMap } from './tablemap';
import { cellAround, CellAttrs, getRow, pointsAtCell } from './util';

/**
 * @public
 */
export const columnResizingPluginKey = new PluginKey<ResizeState>(
  'tableColumnResizing',
);

/**
 * @public
 */
export type ColumnResizingOptions = {
  handleWidth?: number;
  cellMinWidth?: number;
  lastColumnResizable?: boolean;
};

const SPEC_COL_WIDTHS = 'colgroup';
interface ColgroupDecorationSpec {
  type: 'colgroup';
  colWidths: string[];
}
const SPEC_TABLE_WIDTH = 'tablewidth';
interface TableWidthDecorationSpec {
  type: 'tablewidth';
  pos: number;
  css: Record<string, string>;
}

/**
 * @public
 */
export type Dragging = { startX: number; startWidth: number };

/**
 * @public
 */
export function columnResizing({
  handleWidth = 5,
  cellMinWidth = 25,
  lastColumnResizable = true,
}: ColumnResizingOptions = {}): Plugin {
  const plugin = new Plugin<ResizeState>({
    key: columnResizingPluginKey,
    state: {
      init(_, state) {
        return new ResizeState(
          -1,
          false,
          DecorationSet.create(
            state.doc,
            createTableDecorations(state.doc, cellMinWidth),
          ),
        );
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      attributes: (state): Record<string, string> => {
        const pluginState = columnResizingPluginKey.getState(state);
        return pluginState && pluginState.activeHandle > -1
          ? { class: 'resize-cursor' }
          : {};
      },

      handleDOMEvents: {
        mousemove: (view, event) => {
          handleMouseMove(
            view,
            event,
            handleWidth,
            cellMinWidth,
            lastColumnResizable,
          );
        },
        mouseleave: (view) => {
          handleMouseLeave(view);
        },
        mousedown: (view, event) => {
          handleMouseDown(view, event, cellMinWidth);
        },
      },

      decorations: (state) => {
        const pluginState = columnResizingPluginKey.getState(state);
        let decos = DecorationSet.empty;
        if (pluginState) {
          decos = decos.add(
            state.doc,
            pluginState.tableDecos.find(undefined, undefined, () => true),
          );
          if (pluginState.activeHandle > -1) {
            decos = decos.add(
              state.doc,
              handleDecorations(state, pluginState.activeHandle),
            );
          }
        }
        return decos;
      },

      // nodeViews: {},
    },
  });
  return plugin;
}

/**
 * @public
 */
export class ResizeState {
  constructor(
    public activeHandle: number,
    public dragging: Dragging | false,
    public tableDecos: DecorationSet,
  ) {}

  apply(tr: Transaction): ResizeState {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const state = this;

    if (tr.docChanged) {
      state.tableDecos = state.tableDecos.map(tr.mapping, tr.doc);
    }

    const action = tr.getMeta(columnResizingPluginKey);
    if (action) {
      if (action.setHandle != null)
        return new ResizeState(action.setHandle, false, state.tableDecos);
      if (action.setDragging !== undefined)
        return new ResizeState(
          state.activeHandle,
          action.setDragging,
          state.tableDecos,
        );
      let decos = state.tableDecos;
      if (action.setColWidths) {
        const scw = action.setColWidths;
        const removed = decos.find(
          scw.tableStart - 1,
          scw.tableStart,
          (spec) => spec.type === SPEC_COL_WIDTHS,
        );
        if (removed) decos = decos.remove(removed);
        const deco = colgroupDecoration(scw.tableStart, scw.colWidths);
        decos = decos.add(tr.doc, [deco]);
      }
      if (action.setTableWidth) {
        const stw = action.setTableWidth as TableWidthDecorationSpec;
        let decos = state.tableDecos;
        const removed = decos.find(
          stw.pos,
          stw.pos + 1,
          (spec) => spec.type === SPEC_TABLE_WIDTH,
        );
        if (removed) {
          const newDecos: Decoration[] = [];
          removed.forEach((r) => {
            const pos = tr.mapping.map(stw.pos);
            const table = tr.doc.nodeAt(pos);
            if (table?.type.spec.tableRole === 'table') {
              newDecos.push(
                tableWidthDecoration(pos, pos + table.nodeSize, stw.css),
              );
            }
          });
          if (newDecos) decos = decos.remove(removed).add(tr.doc, newDecos);
        }
      }
      if (decos !== state.tableDecos)
        return new ResizeState(state.activeHandle, state.dragging, decos);
    }
    if (tr.docChanged && state.activeHandle > -1) {
      let handle = tr.mapping.map(state.activeHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) {
        handle = -1;
      }
      return new ResizeState(handle, state.dragging, state.tableDecos);
    }
    return state;
  }
}

function handleMouseMove(
  view: EditorView,
  event: MouseEvent,
  handleWidth: number,
  cellMinWidth: number,
  lastColumnResizable: boolean,
): void {
  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState) return;

  if (!pluginState.dragging) {
    const target = domCellAround(event.target as HTMLElement);
    let cell = -1;
    if (target) {
      const { left, right } = target.getBoundingClientRect();
      if (event.clientX - left <= handleWidth)
        cell = edgeCell(view, event, 'left');
      else if (right - event.clientX <= handleWidth)
        cell = edgeCell(view, event, 'right');
    }

    if (cell != pluginState.activeHandle) {
      if (!lastColumnResizable && cell !== -1) {
        const $cell = view.state.doc.resolve(cell);
        const table = $cell.node(-2);
        const map = TableMap.get(table);
        const tableStart = $cell.start(-2);
        const col =
          map.colCount($cell.pos - tableStart) +
          $cell.nodeAfter!.attrs.colspan -
          1;

        if (col == map.width - 1) {
          return;
        }
      }

      updateHandle(view, cell);
    }
  }
}

function handleMouseLeave(view: EditorView): void {
  const pluginState = columnResizingPluginKey.getState(view.state);
  if (pluginState && pluginState.activeHandle > -1 && !pluginState.dragging)
    updateHandle(view, -1);
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent,
  cellMinWidth: number,
): boolean {
  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState || pluginState.activeHandle == -1 || pluginState.dragging)
    return false;

  const cell = view.state.doc.nodeAt(pluginState.activeHandle)!;
  const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, {
      setDragging: { startX: event.clientX, startWidth: width },
    }),
  );

  function finish(event: MouseEvent) {
    window.removeEventListener('mouseup', finish);
    window.removeEventListener('mousemove', move);
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (pluginState?.dragging) {
      updateColumnWidth(
        view,
        pluginState.activeHandle,
        draggedWidth(pluginState.dragging, event, cellMinWidth),
      );
      view.dispatch(
        view.state.tr.setMeta(columnResizingPluginKey, { setDragging: null }),
      );
    }
  }

  function move(event: MouseEvent): void {
    if (!event.which) return finish(event);
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (!pluginState) return;
    if (pluginState.dragging) {
      const dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
      displayColumnWidth(view, pluginState.activeHandle, dragged, cellMinWidth);
    }
  }

  window.addEventListener('mouseup', finish);
  window.addEventListener('mousemove', move);
  event.preventDefault();
  return true;
}

function currentColWidth(
  view: EditorView,
  cellPos: number,
  { colspan, colwidth }: Attrs,
): number {
  const width = colwidth && colwidth[colwidth.length - 1];
  if (width) return width;
  const dom = view.domAtPos(cellPos);
  const node = dom.node.childNodes[dom.offset] as HTMLElement;
  let domWidth = node.offsetWidth,
    parts = colspan;
  if (colwidth)
    for (let i = 0; i < colspan; i++)
      if (colwidth[i]) {
        domWidth -= colwidth[i];
        parts--;
      }
  return domWidth / parts;
}

function domCellAround(target: HTMLElement | null): HTMLElement | null {
  while (target && target.nodeName != 'TD' && target.nodeName != 'TH')
    target =
      target.classList && target.classList.contains('ProseMirror')
        ? null
        : (target.parentNode as HTMLElement);
  return target;
}

function edgeCell(
  view: EditorView,
  event: MouseEvent,
  side: 'left' | 'right',
): number {
  const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!found) return -1;
  const { pos } = found;
  const $cell = cellAround(view.state.doc.resolve(pos));
  if (!$cell) return -1;
  if (side == 'right') return $cell.pos;
  const map = TableMap.get($cell.node(-2)),
    start = $cell.start(-2);
  const index = map.map.indexOf($cell.pos - start);
  return index % map.width == 0 ? -1 : start + map.map[index - 1];
}

function draggedWidth(
  dragging: Dragging,
  event: MouseEvent,
  cellMinWidth: number,
): number {
  const offset = event.clientX - dragging.startX;
  return Math.max(cellMinWidth, dragging.startWidth + offset);
}

function updateHandle(view: EditorView, value: number): void {
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, { setHandle: value }),
  );
}

function updateColumnWidth(
  view: EditorView,
  cell: number,
  width: number,
): void {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-2),
    map = TableMap.get(table),
    start = $cell.start(-2);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;
  const tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    const mapIndex = row * map.width + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue;
    const pos = map.map[mapIndex];
    const attrs = table.nodeAt(pos)!.attrs as CellAttrs;
    const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.colwidth && attrs.colwidth[index] == width) continue;
    const colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : zeroes(attrs.colspan);
    colwidth[index] = width;
    tr.setNodeMarkup(start + pos, null, { ...attrs, colwidth: colwidth });
  }
  if (tr.docChanged) view.dispatch(tr);
}

function displayColumnWidth(
  view: EditorView,
  cell: number,
  width: number,
  cellMinWidth: number,
): void {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-2),
    tableStart = $cell.start(-2);
  const col =
    TableMap.get(table).colCount($cell.pos - tableStart) +
    $cell.nodeAfter!.attrs.colspan -
    1;
  let dom: Node | null = view.domAtPos($cell.start(-2)).node;
  while (dom && dom.nodeName != 'TABLE') {
    dom = dom.parentNode;
  }
  if (!dom) return;
  updateColumnsOnResize(view, table, tableStart, cellMinWidth, col, width);
}

function zeroes(n: number): 0[] {
  return Array(n).fill(0);
}

export function handleDecorations(
  state: EditorState,
  cell: number,
): Decoration[] {
  const decorations = [];
  const $cell = state.doc.resolve(cell);
  const table = $cell.node(-2);
  if (!table) {
    // return DecorationSet.empty;
    return [];
  }
  const map = TableMap.get(table);
  const start = $cell.start(-2);
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan;
  for (let row = 0; row < map.height; row++) {
    const index = col + row * map.width - 1;
    // For positions that are have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col == map.width || map.map[index] != map.map[index + 1]) &&
      (row == 0 || map.map[index - 1] != map.map[index - 1 - map.width])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos)!.nodeSize - 1;
      const dom = document.createElement('div');
      dom.className = 'column-resize-handle';
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  // return DecorationSet.create(state.doc, decorations)
  return decorations;
}

function colgroupDecoration(
  tableStart: number,
  colWidths: string[],
): Decoration {
  return Decoration.widget(
    tableStart,
    (view, getPos) => {
      const colgroup = document.createElement('colgroup');
      for (let c = 0; c < colWidths.length; c++) {
        const colElement = document.createElement('col');
        colElement.style.width = colWidths[c];
        colgroup.appendChild(colElement);
      }
      return colgroup;
    },
    {
      type: SPEC_COL_WIDTHS,
      colWidths,
    } as ColgroupDecorationSpec,
  );
}

function tableWidthDecoration(
  from: number,
  to: number,
  css: Record<string, string>,
): Decoration {
  const style = Object.entries(css)
    .map(([prop, value]) => `${prop}: ${value}`)
    .join('; ');
  return Decoration.node(from, to, { style }, { type: SPEC_TABLE_WIDTH });
}

function tableDecorationsCallback(
  doc: ProsemirrorNode,
  decos: Decoration[],
  cellMinWidth: number,
) {
  return (node: ProsemirrorNode, pos: number) => {
    if (node.type.spec.tableRole === 'table') {
      const tableStart = pos + 1;
      const resolved = doc.resolve(tableStart);
      decos.push(tableWidthDecoration(resolved.before(), resolved.after(), {}));
      const { colWidths } = updateColumnsOnResize(
        null,
        node,
        tableStart,
        cellMinWidth,
      )!;
      decos.push(colgroupDecoration(tableStart, colWidths));
      return false;
    }
    return true;
  };
}

function createTableDecorations(
  doc: ProsemirrorNode,
  cellMinWidth: number = 0,
  from?: number,
  to?: number,
) {
  let decos: Decoration[] = [];
  if (from && to)
    doc.nodesBetween(
      from,
      to,
      tableDecorationsCallback(doc, decos, cellMinWidth),
    );
  else doc.descendants(tableDecorationsCallback(doc, decos, cellMinWidth));
  return decos;
}

/**
 * @public
 */
export function updateColumnsOnResize(
  view: EditorView | null,
  table: ProsemirrorNode,
  tableStart: number,
  cellMinWidth: number,
  overrideCol?: number,
  overrideValue?: number,
): { colWidths: string[]; tableWidth: string } | undefined {
  let totalWidth = 0;
  let fixedWidth = true;
  const row = getRow(table, 0).node;
  if (!row) return;

  const colWidths: string[] = [];
  for (let i = 0, col = 0; i < row.childCount; i++) {
    const { colspan, colwidth } = row.child(i).attrs as CellAttrs;
    for (let j = 0; j < colspan; j++, col++) {
      const hasWidth =
        overrideCol == col ? overrideValue : colwidth && colwidth[j];
      colWidths.push(hasWidth ? hasWidth + 'px' : '');
      totalWidth += hasWidth || cellMinWidth;
      if (!hasWidth) fixedWidth = false;
    }
  }
  const setColWidths = { tableStart, colWidths };
  const pos = tableStart - 1;
  const tableWidth = totalWidth + 'px';
  const setTableWidth = fixedWidth
    ? { pos, css: { 'min-width': '', width: tableWidth } }
    : { pos, css: { 'min-width': tableWidth, width: '' } };
  if (view) {
    view.dispatch(
      view.state.tr.setMeta(columnResizingPluginKey, {
        setColWidths,
        setTableWidth,
      }),
    );
  }
  return { colWidths, tableWidth };
}

// export function updateColgroup(view: EditorView, rect: TableRect): Transaction {
//   const seen: Record<number, boolean> = {};
//   const { table, tableStart } = rect;
//   const { map, width } = rect.map;
//   const colWidths: number[] = [];
//   for (let c = 0; c < width; c++) colWidths[c] = 0;
//   for (let i = 0; i < map.length; i++) {
//     const col = i % width;
//     const pos = map[i];
//     if (!seen[pos]) {
//       colWidths[col] = currentColWidth(
//         view,
//         tableStart + pos,
//         table.nodeAt(pos)!.attrs,
//       );
//       seen[pos] = true;
//     }
//   }
//   const totalWidth = colWidths.reduce((tot, w) => tot + w, 0);
//   return view.state.tr;
//   // .setMeta(columnResizingPluginKey, {
//   //   setColWidths: { tableStart, colWidths },
//   // })
//   // .setMeta(columnResizingPluginKey, {
//   //   setTableWidth: { pos: tableStart - 1, css: { width: totalWidth + 'px' } },
//   // });
// }
