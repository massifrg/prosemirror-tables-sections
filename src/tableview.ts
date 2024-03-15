import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import { CellAttrs, getRow } from './util';

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
    public getPos: () => number | undefined,
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'tableWrapper';
    this.contentDOM = this.dom.appendChild(document.createElement('table'));
    const pos = getPos();
    updateColumnsOnResize(node, this.contentDOM, cellMinWidth);
  }

  update(node: ProsemirrorNode): boolean {
    if (node.type != this.node.type) return false;
    this.node = node;
    updateColumnsOnResize(node, this.contentDOM, this.cellMinWidth);
    // const pos = this.getPos();
    // if (pos) console.log(getTableWidths(node, pos + 1, this.cellMinWidth));
    return true;
  }

  ignoreMutation(record: MutationRecord): boolean {
    const table = this.contentDOM
    const colgroup = getColgroup(table)
    return (
      record.type == 'attributes' &&
      (record.target == table || (colgroup && colgroup.contains(record.target)))
    );
  }
}

function getColgroup(table: HTMLTableElement): HTMLElement {
  let colgroup = table.firstChild as HTMLElement;
  let childIndex = 0;
  while (colgroup) {
    const nodeName = colgroup.nodeName
    if (nodeName === 'COLGROUP') {
      break
    } else if (nodeName==='CAPTION'){
      colgroup = colgroup.nextSibling as HTMLElement;
      childIndex++;
    } else {
      break
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
  cellMinWidth: number,
  overrideCol?: number,
  overrideValue?: number,
): void {
  let totalWidth = 0;
  let fixedWidth = true;
  const colgroup = getColgroup(table)
  if (!colgroup) return;

  let nextDOM = colgroup.firstChild as HTMLElement;
  const row = getRow(node, 0).node;
  if (!row) return;

  for (let i = 0, col = 0; i < row.childCount; i++) {
    const { colspan, colwidth } = row.child(i).attrs as CellAttrs;
    for (let j = 0; j < colspan; j++, col++) {
      const hasWidth =
        overrideCol == col ? overrideValue : colwidth && colwidth[j];
      const cssWidth = hasWidth ? hasWidth + 'px' : '';
      totalWidth += hasWidth || cellMinWidth;
      if (!hasWidth) fixedWidth = false;
      if (!nextDOM) {
        colgroup.appendChild(document.createElement('col')).style.width =
          cssWidth;
      } else {
        if (nextDOM.style.width != cssWidth) nextDOM.style.width = cssWidth;
        nextDOM = nextDOM.nextSibling as HTMLElement;
      }
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
