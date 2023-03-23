import ist from 'ist';
import { Node, Slice } from 'prosemirror-model';
import {
  Command,
  EditorState,
  NodeSelection,
  Selection,
} from 'prosemirror-state';
import { describe, it } from 'vitest';

import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  tableEditing,
  TableMap,
} from '../src/';
import {
  c,
  c11,
  cAnchor,
  cEmpty,
  cHead,
  doc,
  eq,
  p,
  selectionFor,
  table,
  tbody,
  td,
  tr,
} from './build';

describe('CellSelection', () => {
  const t = doc(
    table(
      tbody(
        tr(/* 3*/ cEmpty, /* 7*/ cEmpty, /*11*/ cEmpty),
        tr(/*17*/ cEmpty, /*21*/ cEmpty, /*25*/ cEmpty),
        tr(/*31*/ cEmpty, /*35*/ cEmpty, /*37*/ cEmpty),
      ),
    ),
  );

  function run(anchor: number, head: number, command: Command): EditorState {
    let state = EditorState.create({
      doc: t,
      selection: CellSelection.create(t, anchor, head),
    });
    command(state, (tr) => (state = state.apply(tr)));
    return state;
  }

  it('will put its head/anchor around the head cell', () => {
    let s = CellSelection.create(t, 3, 25);
    ist(s.anchor, 26);
    ist(s.head, 28);
    s = CellSelection.create(t, 25, 3);
    ist(s.anchor, 4);
    ist(s.head, 6);
    s = CellSelection.create(t, 11, 31);
    ist(s.anchor, 32);
    ist(s.head, 34);
    s = CellSelection.create(t, 31, 11);
    ist(s.anchor, 12);
    ist(s.head, 14);
  });

  it('extends a row selection when adding a row', () => {
    let state = run(35, 7, addRowBefore);
    let sel = state.selection as CellSelection;
    let map = TableMap.get(state.doc.nodeAt(0)!);
    ist(map.sectionRows[0], 4);
    ist(sel.$anchorCell.pos, 49);
    ist(sel.$headCell.pos, 7);
    state = run(7, 31, addRowAfter);
    sel = state.selection as CellSelection;
    map = TableMap.get(state.doc.nodeAt(0)!);
    ist(map.sectionRows[0], 4);
    ist(sel.$anchorCell.pos, 7);
    ist(sel.$headCell.pos, 45);
  });

  it('extends a col selection when adding a column', () => {
    let sel = run(17, 25, addColumnAfter).selection as CellSelection;
    ist(sel.$anchorCell.pos, 21);
    ist(sel.$headCell.pos, 33);
    sel = run(25, 31, addColumnBefore).selection as CellSelection;
    ist(sel.$anchorCell.pos, 33);
    ist(sel.$headCell.pos, 39);
  });
});

describe('CellSelection.content', () => {
  function slice(doc: Node) {
    return new Slice(doc.content, 1, 1);
  }

  it('contains only the selected cells', () =>
    ist(
      selectionFor(
        table(
          tbody(
            tr(c11, cAnchor, cEmpty),
            tr(c11, cEmpty, cHead),
            tr(c11, c11, c11),
          ),
        ),
      ).content(),
      slice(table('<a>', tr(c11, cEmpty), tr(cEmpty, c11))),
      eq,
    ));

  it('understands spanning cells', () =>
    ist(
      selectionFor(
        table(tbody(tr(cAnchor, c(2, 2), c11, c11), tr(c11, cHead, c11, c11))),
      ).content(),
      slice(table(tr(c11, c(2, 2), c11), tr(c11, c11))),
      eq,
    ));

  it('cuts off cells sticking out horizontally', () =>
    ist(
      selectionFor(
        table(
          tbody(
            tr(c11, cAnchor, c(2, 1)),
            tr(c(4, 1)),
            tr(c(2, 1), cHead, c11),
          ),
        ),
      ).content(),
      slice(table(tr(c11, c11), tr(td({ colspan: 2 }, p())), tr(cEmpty, c11))),
      eq,
    ));

  it('cuts off cells sticking out vertically', () =>
    ist(
      selectionFor(
        table(
          tbody(
            tr(c11, c(1, 4), c(1, 2)),
            tr(cAnchor),
            tr(c(1, 2), cHead),
            tr(c11),
          ),
        ),
      ).content(),
      slice(table(tr(c11, td({ rowspan: 2 }, p()), cEmpty), tr(c11, c11))),
      eq,
    ));

  it('preserves column widths', () =>
    ist(
      selectionFor(
        table(
          tbody(
            tr(c11, cAnchor, c11),
            tr(td({ colspan: 3, colwidth: [100, 200, 300] }, p('x'))),
            tr(c11, cHead, c11),
          ),
        ),
      ).content(),
      slice(table(tr(c11), tr(td({ colwidth: [200] }, p())), tr(c11))),
      eq,
    ));
});

describe('normalizeSelection', () => {
  const t = doc(
    table(
      tbody(
        tr(/* 3*/ c11, /* 8*/ c11, /*13*/ c11),
        tr(/*20*/ c11, /*25*/ c11, /*30*/ c11),
        tr(/*37*/ c11, /*42*/ c11, /*47*/ c11),
      ),
    ),
  );

  function normalize(
    selection: Selection,
    { allowTableNodeSelection = false } = {},
  ) {
    const state = EditorState.create({
      doc: t,
      selection,
      plugins: [tableEditing({ allowTableNodeSelection })],
    });
    return state.apply(state.tr).selection;
  }

  it('converts a table node selection into a selection of all cells in the table', () => {
    const node_sel = NodeSelection.create(t, 0);
    const norm_node_sel = normalize(node_sel);
    const cell_sel = CellSelection.create(t, 3, 47);
    ist(norm_node_sel, cell_sel, eq);
  });

  it('retains a table node selection if the allowTableNodeSelection option is true', () => {
    const norm_node_sel = normalize(NodeSelection.create(t, 0), {
      allowTableNodeSelection: true,
    });
    const node_sel = NodeSelection.create(t, 0);
    ist(norm_node_sel, node_sel, eq);
  });

  it('converts a row node selection into a cell selection', () => {
    ist(
      normalize(NodeSelection.create(t, 2)),
      CellSelection.create(t, 3, 13),
      eq,
    );
  });

  it('converts a cell node selection into a cell selection', () => {
    ist(
      normalize(NodeSelection.create(t, 3)),
      CellSelection.create(t, 3, 3),
      eq,
    );
  });
});
