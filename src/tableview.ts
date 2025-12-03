import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorView, NodeView, ViewMutationRecord } from 'prosemirror-view';
import { CellAttrs, getRow } from './util';
import { TableMap } from './tablemap';

export function getColgroupWidths(tableEl: HTMLElement): number[] {
  let el: Element | null = tableEl;
  while (el && el.tagName !== 'TABLE') el = el.parentElement;
  if (el) {
    let colgroup = el.firstElementChild as HTMLElement;
    while (colgroup && colgroup.tagName !== 'COLGROUP')
      colgroup = colgroup.nextElementSibling as HTMLElement;
    if (colgroup) {
      const widths: number[] = [];
      let col = colgroup.firstElementChild as HTMLElement;
      while (col) {
        if (col.tagName === 'COL') {
          const width = parseFloat(window.getComputedStyle(col).width);
          widths.push(width);
        }
        col = col.nextElementSibling as HTMLElement;
      }
      return widths;
    }
  }
  return [];
}

/**
 * @public
 */
export class TableView implements NodeView {
  public dom: HTMLDivElement;
  public contentDOM: HTMLTableElement;

  constructor(
    public node: ProsemirrorNode,
    public cellMinWidth: number,
    public view: EditorView,
    public relativeWidths: boolean,
    public getPos: () => number | undefined,
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'tableWrapper';
    const table = document.createElement('table');
    if (relativeWidths) {
      table.setAttribute('data-colwidth', node.attrs.colwidth);
      table.setAttribute('data-width', node.attrs.width);
      table.style.tableLayout = 'fixed';
    }
    this.contentDOM = this.dom.appendChild(table);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (table === entry.target) {
          updateColumnsOnResize(node, table, cellMinWidth, relativeWidths);
          if (table.getAttribute('data-width')) ro.disconnect();
        }
      }
    });
    ro.observe(this.contentDOM);
  }

  update(node: ProsemirrorNode): boolean {
    if (node.type != this.node.type) return false;
    this.node = node;
    updateColumnsOnResize(
      node,
      this.contentDOM,
      this.cellMinWidth,
      !!this.relativeWidths,
    );
    // showTableWidths(this.contentDOM, this.dom);
    // const pos = this.getPos();
    // if (pos) console.log(getTableWidths(node, pos + 1, this.cellMinWidth));
    return true;
  }

  ignoreMutation(record: ViewMutationRecord): boolean {
    const table = this.contentDOM;
    const target = record.target;
    return target == table || table.contains(target);
  }
}

export function getColgroup(table: HTMLTableElement): HTMLElement {
  let colgroup = table.firstChild as HTMLElement;
  let childIndex = 0;
  while (colgroup) {
    const nodeName = colgroup.nodeName;
    if (nodeName === 'COLGROUP') {
      break;
    } else if (nodeName === 'CAPTION') {
      colgroup = colgroup.nextSibling as HTMLElement;
      childIndex++;
    } else {
      break;
    }
  }
  if (colgroup) {
    if (colgroup.nodeName === 'COLGROUP') {
    } else {
      colgroup = table.insertBefore(
        document.createElement('COLGROUP'),
        table.children[childIndex],
      );
    }
  } else {
    if (table.children.length === 0) {
      colgroup = table.appendChild(document.createElement('COLGROUP'));
    } else {
      colgroup = table.insertBefore(
        document.createElement('COLGROUP'),
        table.children[0],
      );
    }
  }
  return colgroup;
}

/**
 * @public
 */
export function updateColumnsOnResize(
  node: ProsemirrorNode,
  table: HTMLTableElement,
  defaultCellMinWidth: number,
  relativeColWidths: boolean,
  overrideCol?: number,
  overrideValue?: number,
): void {
  let totalWidth = 0;
  let fixedWidth = true;
  const colgroup = getColgroup(table);
  if (!colgroup) return;
  let cssWidths: string[] = [];
  if (relativeColWidths) {
    const columnsCount = TableMap.get(node).width;
    let colwidth: number[] = node.attrs.colwidth;
    colwidth =
      colwidth && colwidth.length === columnsCount
        ? colwidth
        : Array(columnsCount).fill(0);
    let tableWidth =
      node.attrs.width || parseFloat(window.getComputedStyle(table).width);
    fixedWidth = !colwidth.find((cw) => cw === 0);
    const widths: number[] = colwidth.map((cw, i) =>
      i === overrideCol
        ? overrideValue!
        : cw === 0
          ? defaultCellMinWidth
          : cw * tableWidth,
    );
    totalWidth = widths.reduce((acc, w) => acc + w, 0);
    cssWidths = widths.map((w) => w + 'px');
    table.setAttribute('data-colwidth', colwidth.toString());
    table.setAttribute('data-width', Math.round(totalWidth).toString());
  } else {
    const row = getRow(node, 0).node;
    if (!row) return;
    for (let i = 0, col = 0; i < row.childCount; i++) {
      const { colspan, colwidth } = row.child(i).attrs as CellAttrs;
      for (let j = 0; j < colspan; j++, col++) {
        const hasWidth =
          overrideCol == col ? overrideValue : colwidth && colwidth[j];
        cssWidths[col] = hasWidth ? hasWidth + 'px' : '';
        totalWidth += hasWidth || defaultCellMinWidth;
        if (!hasWidth) fixedWidth = false;
      }
    }
  }

  let nextDOM = colgroup.firstChild as HTMLElement;
  for (let i = 0; i < cssWidths.length; i++) {
    const cssWidth = cssWidths[i];
    if (!nextDOM) {
      colgroup.appendChild(document.createElement('COL')).style.width =
        cssWidth;
    } else {
      if (nextDOM.style.width != cssWidth) nextDOM.style.width = cssWidth;
      nextDOM = nextDOM.nextSibling as HTMLElement;
    }
  }

  while (nextDOM) {
    const after = nextDOM.nextSibling;
    nextDOM.parentNode?.removeChild(nextDOM);
    nextDOM = after as HTMLElement;
  }

  if (fixedWidth) {
    table.style.width = totalWidth + 'px';
    table.style.minWidth = '';
  } else {
    table.style.width = '';
    table.style.minWidth = totalWidth + 'px';
  }
}
