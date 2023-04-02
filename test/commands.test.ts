import ist from 'ist';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { describe, it } from 'vitest';

import {
  doc,
  table,
  tr,
  p,
  td,
  th,
  c,
  h,
  c11,
  h11,
  cEmpty,
  hEmpty,
  cCursor,
  hCursor,
  cHead,
  cAnchor,
  eq,
  selectionFor,
  TaggedNode,
  tbody,
  thead,
  tfoot,
  caption,
} from './build';
import {
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  addRowAfter,
  addRowBefore,
  deleteRow,
  mergeCells,
  splitCell,
  splitCellWithType,
  setCellAttr,
  toggleHeader,
  toggleHeaderRow,
  toggleHeaderColumn,
  addTableHead,
  addTableFoot,
  deleteSection,
  addBodyBefore,
  addBodyAfter,
} from '../src/';
import { logNode } from './log';

function test(
  doc: TaggedNode,
  command: Command,
  expected_result: Node | null | undefined,
  debug = false,
  verbose = false,
) {
  let state = EditorState.create({ doc, selection: selectionFor(doc) });
  if (debug) logNode(state.doc, 'BEFORE:', !verbose);
  console.log();
  const ran = command(state, (tr) => (state = state.apply(tr)));
  if (expected_result == null) ist(ran, false);
  else {
    if (debug) {
      logNode(state.doc, 'RESULT:', !verbose);
      console.log();
      logNode(expected_result, 'EXPECTED:', !verbose);
    }
    ist(state.doc, expected_result, eq);
  }
}

describe('addColumnAfter', () => {
  it('can add a plain column', () =>
    test(
      table(
        thead(tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11)),
        tfoot(tr(c11, c11, c11)),
      ),
      addColumnAfter,
      table(
        thead(tr(c11, c11, cEmpty, c11)),
        tbody(
          tr(c11, c11, cEmpty, c11),
          tr(c11, c11, cEmpty, c11),
          tr(c11, c11, cEmpty, c11),
        ),
        tfoot(tr(c11, c11, cEmpty, c11)),
      ),
    ));

  it('can add a column at the right of the table', () =>
    test(
      table(
        caption(p('x')),
        thead(tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, cCursor)),
        tfoot(tr(c11, c11, c11)),
      ),
      addColumnAfter,
      table(
        caption(p('x')),
        thead(tr(c11, c11, c11, cEmpty)),
        tbody(
          tr(c11, c11, c11, cEmpty),
          tr(c11, c(2, 1), cEmpty),
          tr(c11, c11, c11, cEmpty),
        ),
        tfoot(tr(c11, c11, c11, cEmpty)),
      ),
    ));

  it('can add a second cell', () =>
    test(
      table(tbody(tr(cCursor))),
      addColumnAfter,
      table(tbody(tr(c11, cEmpty))),
    ));

  it('can grow a colspan cell', () =>
    test(
      table(tbody(tr(cCursor, c11), tr(c(2, 1)))),
      addColumnAfter,
      table(tbody(tr(c11, cEmpty, c11), tr(c(3, 1)))),
    ));

  it("places new cells in the right spot when there's row spans", () =>
    test(
      table(tbody(tr(c11, c(1, 2), c(1, 2)), tr(c11), tr(c11, cCursor, c11))),
      addColumnAfter,
      table(
        tbody(
          tr(c11, c(1, 2), cEmpty, c(1, 2)),
          tr(c11, cEmpty),
          tr(c11, c11, cEmpty, c11),
        ),
      ),
    ));

  it('can place new cells into an empty row', () =>
    test(
      table(tbody(tr(c(1, 2), c(1, 2)), tr(), tr(cCursor, c11))),
      addColumnAfter,
      table(
        tbody(tr(c(1, 2), cEmpty, c(1, 2)), tr(cEmpty), tr(c11, cEmpty, c11)),
      ),
    ));

  it('will skip ahead when growing a rowspan cell', () =>
    test(
      table(tbody(tr(c(2, 2), c11), tr(c11), tr(cCursor, c11, c11))),
      addColumnAfter,
      table(tbody(tr(c(3, 2), c11), tr(c11), tr(cCursor, cEmpty, c11, c11))),
    ));

  it('will use the right side of a single cell selection', () =>
    test(
      table(tbody(tr(cAnchor, c11), tr(c11, c11))),
      addColumnAfter,
      table(tbody(tr(c11, cEmpty, c11), tr(c11, cEmpty, c11))),
    ));

  it('will use the right side of a bigger cell selection', () =>
    test(
      table(tbody(tr(cHead, c11, c11), tr(c11, cAnchor, c11))),
      addColumnAfter,
      table(tbody(tr(c11, c11, cEmpty, c11), tr(c11, c11, cEmpty, c11))),
    ));

  it('properly handles a cell node selection', () =>
    test(
      table(tbody(tr('<node>', c11, c11), tr(c11, c11))),
      addColumnAfter,
      table(tbody(tr(c11, cEmpty, c11), tr(c11, cEmpty, c11))),
    ));

  it('preserves header rows', () =>
    test(
      table(tbody(tr(h11, h11), tr(c11, cCursor))),
      addColumnAfter,
      table(tbody(tr(h11, h11, hEmpty), tr(c11, c11, cEmpty))),
    ));

  it('uses column after as reference when header column before', () =>
    test(
      table(tbody(tr(h11, h11), tr(hCursor, c11))),
      addColumnAfter,
      table(tbody(tr(h11, hEmpty, h11), tr(h11, cEmpty, c11))),
    ));

  it('creates regular cells when only next to a header column', () =>
    test(
      table(tbody(tr(c11, h11), tr(c11, hCursor))),
      addColumnAfter,
      table(tbody(tr(c11, h11, cEmpty), tr(c11, h11, cEmpty))),
    ));

  it('does nothing outside of a table', () =>
    test(doc(p('foo<cursor>')), addColumnAfter, null));

  it('preserves column widths', () =>
    test(
      table(
        tbody(
          tr(cAnchor, c11),
          tr(td({ colspan: 2, colwidth: [100, 200] }, p('a'))),
        ),
      ),
      addColumnAfter,
      table(
        tbody(
          tr(cAnchor, cEmpty, c11),
          tr(td({ colspan: 3, colwidth: [100, 0, 200] }, p('a'))),
        ),
      ),
    ));
});

describe('addColumnBefore', () => {
  it('can add a plain column', () =>
    test(
      table(tbody(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11))),
      addColumnBefore,
      table(
        tbody(
          tr(c11, cEmpty, c11, c11),
          tr(c11, cEmpty, c11, c11),
          tr(c11, cEmpty, c11, c11),
        ),
      ),
    ));

  it('can add a column at the left of the table', () =>
    test(
      table(tbody(tr(cCursor, c11, c11), tr(c11, c11, c11), tr(c11, c11, c11))),
      addColumnBefore,
      table(
        tbody(
          tr(cEmpty, c11, c11, c11),
          tr(cEmpty, c11, c11, c11),
          tr(cEmpty, c11, c11, c11),
        ),
      ),
    ));

  it('will use the left side of a single cell selection', () =>
    test(
      table(tbody(tr(cAnchor, c11), tr(c11, c11))),
      addColumnBefore,
      table(tbody(tr(cEmpty, c11, c11), tr(cEmpty, c11, c11))),
    ));

  it('will use the left side of a bigger cell selection', () =>
    test(
      table(tbody(tr(c11, cHead, c11), tr(c11, c11, cAnchor))),
      addColumnBefore,
      table(tbody(tr(c11, cEmpty, c11, c11), tr(c11, cEmpty, c11, c11))),
    ));

  it('preserves header rows', () =>
    test(
      table(tbody(tr(h11, h11), tr(cCursor, c11))),
      addColumnBefore,
      table(tbody(tr(hEmpty, h11, h11), tr(cEmpty, c11, c11))),
    ));
});

describe('deleteColumn', () => {
  it('can delete a plain column', () =>
    test(
      table(
        tbody(
          tr(cEmpty, c11, c11),
          tr(c11, cCursor, c11),
          tr(c11, c11, cEmpty),
        ),
      ),
      deleteColumn,
      table(tbody(tr(cEmpty, c11), tr(c11, c11), tr(c11, cEmpty))),
    ));

  it('can delete the first column', () =>
    test(
      table(
        tbody(tr(cCursor, cEmpty, c11), tr(c11, c11, c11), tr(c11, c11, c11)),
      ),
      deleteColumn,
      table(tbody(tr(cEmpty, c11), tr(c11, c11), tr(c11, c11))),
    ));

  it('can delete the last column', () =>
    test(
      table(
        tbody(tr(c11, cEmpty, cCursor), tr(c11, c11, c11), tr(c11, c11, c11)),
      ),
      deleteColumn,
      table(tbody(tr(c11, cEmpty), tr(c11, c11), tr(c11, c11))),
    ));

  it("can reduce a cell's colspan", () =>
    test(
      table(tbody(tr(c11, cCursor), tr(c(2, 1)))),
      deleteColumn,
      table(tbody(tr(c11), tr(c11))),
    ));

  it('will skip rows after a rowspan', () =>
    test(
      table(tbody(tr(c11, cCursor), tr(c11, c(1, 2)), tr(c11))),
      deleteColumn,
      table(tbody(tr(c11), tr(c11), tr(c11))),
    ));

  it('will delete all columns under a colspan cell', () =>
    test(
      table(
        tbody(tr(c11, td({ colspan: 2 }, p('<cursor>'))), tr(cEmpty, c11, c11)),
      ),
      deleteColumn,
      table(tbody(tr(c11), tr(cEmpty))),
    ));

  it('deletes a cell-selected column', () =>
    test(
      table(tbody(tr(cEmpty, cAnchor), tr(c11, cHead))),
      deleteColumn,
      table(tbody(tr(cEmpty), tr(c11))),
    ));

  it('deletes multiple cell-selected columns', () =>
    test(
      table(
        tbody(tr(c(1, 2), cAnchor, c11), tr(c11, cEmpty), tr(cHead, c11, c11)),
      ),
      deleteColumn,
      table(tbody(tr(c11), tr(cEmpty), tr(c11))),
    ));

  it('leaves column widths intact', () =>
    test(
      table(
        tbody(
          tr(c11, cAnchor, c11),
          tr(td({ colspan: 3, colwidth: [100, 200, 300] }, p('y'))),
        ),
      ),
      deleteColumn,
      table(
        tbody(
          tr(c11, c11),
          tr(td({ colspan: 2, colwidth: [100, 300] }, p('y'))),
        ),
      ),
    ));

  it('resets column width when all zeroes', () =>
    test(
      table(
        tbody(
          tr(c11, cAnchor, c11),
          tr(td({ colspan: 3, colwidth: [0, 200, 0] }, p('y'))),
        ),
      ),
      deleteColumn,
      table(tbody(tr(c11, c11), tr(td({ colspan: 2 }, p('y'))))),
    ));
});

describe('addRowAfter', () => {
  it('can add a simple row', () =>
    test(
      table(tbody(tr(cCursor, c11), tr(c11, c11))),
      addRowAfter,
      table(tbody(tr(c11, c11), tr(cEmpty, cEmpty), tr(c11, c11))),
    ));

  it('can add a row at the end', () =>
    test(
      table(tbody(tr(c11, c11), tr(c11, cCursor))),
      addRowAfter,
      table(tbody(tr(c11, c11), tr(c11, c11), tr(cEmpty, cEmpty))),
    ));

  it('adds a row at the end of a section in the same section', () =>
    test(
      table(tbody(tr(c11, c11), tr(c11, cCursor)), tbody(tr(c11, c11))),
      addRowAfter,
      table(
        tbody(tr(c11, c11), tr(c11, c11), tr(cEmpty, cEmpty)),
        tbody(tr(c11, c11)),
      ),
    ));

  it('increases rowspan when needed', () =>
    test(
      table(tbody(tr(cCursor, c(1, 2)), tr(c11))),
      addRowAfter,
      table(tbody(tr(c11, c(1, 3)), tr(cEmpty), tr(c11))),
    ));

  it('skips columns for colspan cells', () =>
    test(
      table(tbody(tr(cCursor, c(2, 2)), tr(c11))),
      addRowAfter,
      table(tbody(tr(c11, c(2, 3)), tr(cEmpty), tr(c11))),
    ));

  it('picks the row after a cell selection', () =>
    test(
      table(tbody(tr(cHead, c11, c11), tr(c11, cAnchor, c11), tr(c(3, 1)))),
      addRowAfter,
      table(
        tbody(
          tr(c11, c11, c11),
          tr(c11, c11, c11),
          tr(cEmpty, cEmpty, cEmpty),
          tr(c(3, 1)),
        ),
      ),
    ));

  it('preserves header columns', () =>
    test(
      table(tbody(tr(c11, hCursor), tr(c11, h11))),
      addRowAfter,
      table(tbody(tr(c11, h11), tr(cEmpty, hEmpty), tr(c11, h11))),
    ));

  it('uses next row as reference when row before is a header', () =>
    test(
      table(tbody(tr(h11, hCursor), tr(c11, h11))),
      addRowAfter,
      table(tbody(tr(h11, h11), tr(cEmpty, hEmpty), tr(c11, h11))),
    ));

  it('creates regular cells when no reference row is available', () =>
    test(
      table(tbody(tr(h11, hCursor))),
      addRowAfter,
      table(tbody(tr(h11, h11), tr(cEmpty, cEmpty))),
    ));
});

describe('addRowBefore', () => {
  it('can add a simple row', () =>
    test(
      table(tbody(tr(c11, c11), tr(cCursor, c11))),
      addRowBefore,
      table(tbody(tr(c11, c11), tr(cEmpty, cEmpty), tr(c11, c11))),
    ));

  it('can add a row at the start', () =>
    test(
      table(tbody(tr(cCursor, c11), tr(c11, c11))),
      addRowBefore,
      table(tbody(tr(cEmpty, cEmpty), tr(c11, c11), tr(c11, c11))),
    ));

  it('picks the row before a cell selection', () =>
    test(
      table(
        tbody(tr(c11, c(2, 1)), tr(cAnchor, c11, c11), tr(c11, cHead, c11)),
      ),
      addRowBefore,
      table(
        tbody(
          tr(c11, c(2, 1)),
          tr(cEmpty, cEmpty, cEmpty),
          tr(c11, c11, c11),
          tr(c11, c11, c11),
        ),
      ),
    ));

  it('preserves header columns', () =>
    test(
      table(tbody(tr(hCursor, c11), tr(h11, c11))),
      addRowBefore,
      table(tbody(tr(hEmpty, cEmpty), tr(h11, c11), tr(h11, c11))),
    ));
});

describe('deleteRow', () => {
  it('can delete a simple row', () =>
    test(
      table(tbody(tr(c11, cEmpty), tr(cCursor, c11), tr(c11, cEmpty))),
      deleteRow,
      table(tbody(tr(c11, cEmpty), tr(c11, cEmpty))),
    ));

  it('can delete the first row', () =>
    test(
      table(tbody(tr(c11, cCursor), tr(cEmpty, c11), tr(c11, cEmpty))),
      deleteRow,
      table(tbody(tr(cEmpty, c11), tr(c11, cEmpty))),
    ));

  it('can delete the last row', () =>
    test(
      table(tbody(tr(cEmpty, c11), tr(c11, cEmpty), tr(c11, cCursor))),
      deleteRow,
      table(tbody(tr(cEmpty, c11), tr(c11, cEmpty))),
    ));

  it('can shrink rowspan cells', () =>
    test(
      table(tbody(tr(c(1, 2), c11, c(1, 3)), tr(cCursor), tr(c11, c11))),
      deleteRow,
      table(tbody(tr(c11, c11, c(1, 2)), tr(c11, c11))),
    ));

  it('can move cells that start in the deleted row', () =>
    test(
      table(tbody(tr(c(1, 2), cCursor), tr(cEmpty))),
      deleteRow,
      table(tbody(tr(c11, cEmpty))),
    ));

  it('deletes multiple rows when the start cell has a rowspan', () =>
    test(
      table(
        tbody(
          tr(td({ rowspan: 3 }, p('<cursor>')), c11),
          tr(c11),
          tr(c11),
          tr(c11, c11),
        ),
      ),
      deleteRow,
      table(tbody(tr(c11, c11))),
    ));

  it('skips columns when adjusting rowspan', () =>
    test(
      table(tbody(tr(cCursor, c(2, 2)), tr(c11))),
      deleteRow,
      table(tbody(tr(c11, c(2, 1)))),
    ));

  it('can delete a cell selection', () =>
    test(
      table(tbody(tr(cAnchor, c11), tr(c11, cEmpty))),
      deleteRow,
      table(tbody(tr(c11, cEmpty))),
    ));

  it('will delete all rows in the cell selection', () =>
    test(
      table(
        tbody(
          tr(c11, cEmpty),
          tr(cAnchor, c11),
          tr(c11, cHead),
          tr(cEmpty, c11),
        ),
      ),
      deleteRow,
      table(tbody(tr(c11, cEmpty), tr(cEmpty, c11))),
    ));

  it('can delete rows across sections', () =>
    test(
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(cEmpty, c11, c11), tr(c11, cAnchor, c11)),
        tbody(tr(c11, cHead, td(p('para1'))), tr(td(p('para2')), c11, cEmpty)),
        tfoot(tr(c11, c11, c11)),
      ),
      deleteRow,
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(cEmpty, c11, c11)),
        tbody(tr(td(p('para2')), c11, cEmpty)),
        tfoot(tr(c11, c11, c11)),
      ),
    ));

  it('deletes a section when all its rows are deleted', () =>
    test(
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(cAnchor, c11, c11), tr(c11, cHead, c11)),
        tbody(tr(c11, cEmpty, td(p('para1'))), tr(td(p('para2')), c11, cEmpty)),
        tfoot(tr(c11, c11, c11)),
      ),
      deleteRow,
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(c11, cEmpty, td(p('para1'))), tr(td(p('para2')), c11, cEmpty)),
        tfoot(tr(c11, c11, c11)),
      ),
    ));

  it('correctly deletes a row in a section, then a complete section and then another row in another section', () =>
    test(
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(c11, c11, td(p('para1'))), tr(c11, cAnchor, c11)),
        tbody(tr(c11, cEmpty, td(p('para1'))), tr(td(p('para2')), c11, cEmpty)),
        tfoot(tr(c11, cHead, c11), tr(c11, c(2, 1))),
      ),
      deleteRow,
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(c11, c11, td(p('para1')))),
        tfoot(tr(c11, c(2, 1))),
      ),
    ));

  it('correctly deletes a row in a section and then all the sections until the end of a table', () =>
    test(
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(c11, c11, td(p('para1'))), tr(c11, cAnchor, c11)),
        tbody(tr(c11, cEmpty, td(p('para1'))), tr(td(p('para2')), c11, cEmpty)),
        tfoot(tr(c11, c11, c11), tr(cHead, c(2, 1))),
      ),
      deleteRow,
      table(
        caption(p('caption')),
        thead(tr(c(3, 1))),
        tbody(tr(c11, c11, td(p('para1')))),
      ),
    ));
});

describe('addTableHead', () => {
  it('can add the table head section as first section', () => {
    test(
      table(
        caption(p('caption')),
        tbody(tr(c(2, 1), c11), tr(cAnchor, cHead, c11)),
      ),
      addTableHead,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(cAnchor, cHead, c11)),
      ),
    );
  });
});

describe('addTableFoot', () => {
  it('can add the table foot section as last section', () => {
    test(
      table(
        caption(p('caption')),
        tbody(tr(c(2, 1), c11), tr(cAnchor, cHead, c11)),
      ),
      addTableFoot,
      table(
        caption(p('caption')),
        tbody(tr(c(2, 1), c11), tr(cAnchor, cHead, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });
});

describe('deleteSection', () => {
  it('can delete the section of the cell with the (empty) selection', () => {
    test(
      table(
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(cAnchor, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
      deleteSection,
      table(
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });

  it("can delete the section when there's a caption", () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(cAnchor, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
      deleteSection,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });

  it('can delete two partially selected sections', () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(cAnchor, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, cHead, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
      deleteSection,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });

  it("can't delete the whole table", () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, cHead, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, cAnchor)),
      ),
      deleteSection,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, cHead, hEmpty)),
        tbody(tr(c(2, 1), c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, cAnchor)),
      ),
    );
  });
});

describe('addBodyBefore', () => {
  it('can add a body section before a body', () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c11, c11, c11), tr(cAnchor, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
      addBodyBefore,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(cEmpty, cEmpty, cEmpty)),
        tbody(tr(c11, c11, c11), tr(cAnchor, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });
  it('can add a body section before a foot section', () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, cAnchor)),
      ),
      addBodyBefore,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tbody(tr(cEmpty, cEmpty, cEmpty)),
        tfoot(tr(hEmpty, hEmpty, cAnchor)),
      ),
    );
  });
  it("can't add a body section before a head section", () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, cAnchor, hEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
      addBodyBefore,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, cAnchor, hEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });
});

describe('addBodyAfter', () => {
  it('can add a body section after a body', () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c11, c11, c11), tr(cAnchor, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
      addBodyAfter,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c11, c11, c11), tr(cAnchor, c11, c11)),
        tbody(tr(cEmpty, cEmpty, cEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });
  it('can add a body section after a head section', () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, cAnchor, hEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
      addBodyAfter,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, cAnchor, hEmpty)),
        tbody(tr(cEmpty, cEmpty, cEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, hEmpty, hEmpty)),
      ),
    );
  });
  it("can't add a body section after a foot section", () => {
    test(
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, cAnchor, hEmpty)),
      ),
      addBodyAfter,
      table(
        caption(p('caption')),
        thead(tr(hEmpty, hEmpty, hEmpty)),
        tbody(tr(c11, c11, c11), tr(c11, c11, c11)),
        tbody(tr(c11, c11, c11), tr(c11, c(2, 1)), tr(c11, c11, c11)),
        tfoot(tr(hEmpty, cAnchor, hEmpty)),
      ),
    );
  });
});

describe('mergeCells', () => {
  it("doesn't do anything when only one cell is selected", () =>
    test(table(tbody(tr(cAnchor, c11))), mergeCells, null));

  it("doesn't do anything when the selection cuts across spanning cells", () =>
    test(
      table(tbody(tr(cAnchor, c(2, 1)), tr(c11, cHead, c11))),
      mergeCells,
      null,
    ));

  it('can merge two cells in a column', () =>
    test(
      table(tbody(tr(cAnchor, cHead, c11))),
      mergeCells,
      table(tbody(tr(td({ colspan: 2 }, p('x'), p('x')), c11))),
    ));

  it('can merge two cells in a row', () =>
    test(
      table(tbody(tr(cAnchor, c11), tr(cHead, c11))),
      mergeCells,
      table(tbody(tr(td({ rowspan: 2 }, p('x'), p('x')), c11), tr(c11))),
    ));

  it('can merge a rectangle of cells', () =>
    test(
      table(
        tbody(
          tr(c11, cAnchor, cEmpty, cEmpty, c11),
          tr(c11, cEmpty, cEmpty, cHead, c11),
        ),
      ),
      mergeCells,
      table(
        tbody(
          tr(c11, td({ rowspan: 2, colspan: 3 }, p('x'), p('x')), c11),
          tr(c11, c11),
        ),
      ),
    ));

  it('can merge already spanning cells', () =>
    test(
      table(
        tbody(
          tr(c11, cAnchor, c(1, 2), cEmpty, c11),
          tr(c11, cEmpty, cHead, c11),
        ),
      ),
      mergeCells,
      table(
        tbody(
          tr(c11, td({ rowspan: 2, colspan: 3 }, p('x'), p('x'), p('x')), c11),
          tr(c11, c11),
        ),
      ),
    ));

  it('keeps the column width of the first col', () =>
    test(
      table(
        tbody(tr(td({ colwidth: [100] }, p('x<anchor>')), c11), tr(c11, cHead)),
      ),
      mergeCells,
      table(
        tbody(
          tr(
            td(
              { colspan: 2, rowspan: 2, colwidth: [100, 0] },
              p('x'),
              p('x'),
              p('x'),
              p('x'),
            ),
          ),
          tr(),
        ),
      ),
    ));
});

describe('splitCell', () => {
  it('does nothing when cursor is inside of a cell with attributes colspan = 1 and rowspan = 1', () =>
    test(table(tbody(tr(cCursor, c11))), splitCell, null));

  it('can split when col-spanning cell with cursor', () =>
    test(
      table(tbody(tr(td({ colspan: 2 }, p('foo<cursor>')), c11))),
      splitCell,
      table(tbody(tr(td(p('foo')), cEmpty, c11))),
    ));

  it('can split when col-spanning header-cell with cursor', () =>
    test(
      table(tbody(tr(th({ colspan: 2 }, p('foo<cursor>'))))),
      splitCell,
      table(tbody(tr(th(p('foo')), hEmpty))),
    ));

  it('does nothing for a multi-cell selection', () =>
    test(table(tbody(tr(cAnchor, cHead, c11))), splitCell, null));

  it("does nothing when the selected cell doesn't span anything", () =>
    test(table(tbody(tr(cAnchor, c11))), splitCell, null));

  it('can split a col-spanning cell', () =>
    test(
      table(tbody(tr(td({ colspan: 2 }, p('foo<anchor>')), c11))),
      splitCell,
      table(tbody(tr(td(p('foo')), cEmpty, c11))),
    ));

  it('can split a row-spanning cell', () =>
    test(
      table(
        tbody(tr(c11, td({ rowspan: 2 }, p('foo<anchor>')), c11), tr(c11, c11)),
      ),
      splitCell,
      table(tbody(tr(c11, td(p('foo')), c11), tr(c11, cEmpty, c11))),
    ));

  it('can split a rectangular cell', () =>
    test(
      table(
        tbody(
          tr(c(4, 1)),
          tr(c11, td({ rowspan: 2, colspan: 2 }, p('foo<anchor>')), c11),
          tr(c11, c11),
        ),
      ),
      splitCell,
      table(
        tbody(
          tr(c(4, 1)),
          tr(c11, td(p('foo')), cEmpty, c11),
          tr(c11, cEmpty, cEmpty, c11),
        ),
      ),
    ));

  it('distributes column widths', () =>
    test(
      table(
        tbody(tr(td({ colspan: 3, colwidth: [100, 0, 200] }, p('a<anchor>')))),
      ),
      splitCell,
      table(
        tbody(
          tr(
            td({ colwidth: [100] }, p('a')),
            cEmpty,
            td({ colwidth: [200] }, p()),
          ),
        ),
      ),
    ));

  describe('with custom cell type', () => {
    function createGetCellType(state: EditorState) {
      return ({ row }: { row: number }) => {
        if (row === 0) {
          return state.schema.nodes.table_header;
        }
        return state.schema.nodes.table_cell;
      };
    }

    const splitCellWithOnlyHeaderInColumnZero = (
      state: EditorState,
      dispatch?: (tr: Transaction) => void,
    ) => splitCellWithType(createGetCellType(state))(state, dispatch);

    it('can split a row-spanning header cell into a header and normal cell ', () =>
      test(
        table(
          tbody(
            tr(c11, td({ rowspan: 2 }, p('foo<anchor>')), c11),
            tr(c11, c11),
          ),
        ),
        splitCellWithOnlyHeaderInColumnZero,
        table(tbody(tr(c11, th(p('foo')), c11), tr(c11, cEmpty, c11))),
      ));
  });
});

describe('setCellAttr', () => {
  const cAttr = td({ test: 'value' }, p('x'));

  it('can set an attribute on a parent cell', () =>
    test(
      table(tbody(tr(cCursor, c11))),
      setCellAttr('test', 'value'),
      table(tbody(tr(cAttr, c11))),
    ));

  it('does nothing when the attribute is already there', () =>
    test(table(tbody(tr(cCursor, c11))), setCellAttr('test', 'default'), null));

  it('will set attributes on all cells covered by a cell selection', () =>
    test(
      table(
        tbody(tr(c11, cAnchor, c11), tr(c(2, 1), cHead), tr(c11, c11, c11)),
      ),
      setCellAttr('test', 'value'),
      table(
        tbody(tr(c11, cAttr, cAttr), tr(c(2, 1), cAttr), tr(c11, c11, c11)),
      ),
    ));
});

describe('toggleHeaderRow', () => {
  it('turns a non-header row into header', () =>
    test(
      doc(table(tbody(tr(cCursor, c11), tr(c11, c11)))),
      toggleHeaderRow,
      doc(table(tbody(tr(h11, h11), tr(c11, c11)))),
    ));

  it('turns a header row into regular cells', () =>
    test(
      doc(table(tbody(tr(hCursor, h11), tr(c11, c11)))),
      toggleHeaderRow,
      doc(table(tbody(tr(c11, c11), tr(c11, c11)))),
    ));

  it('turns a partial header row into regular cells', () =>
    test(
      doc(table(tbody(tr(cCursor, h11), tr(c11, c11)))),
      toggleHeaderRow,
      doc(table(tbody(tr(c11, c11), tr(c11, c11)))),
    ));

  it('leaves cell spans intact', () =>
    test(
      doc(table(tbody(tr(cCursor, c(2, 2)), tr(c11), tr(c11, c11, c11)))),
      toggleHeaderRow,
      doc(table(tbody(tr(h11, h(2, 2)), tr(c11), tr(c11, c11, c11)))),
    ));
});

describe('toggleHeaderColumn', () => {
  it('turns a non-header column into header', () =>
    test(
      doc(table(tbody(tr(cCursor, c11), tr(c11, c11)))),
      toggleHeaderColumn,
      doc(table(tbody(tr(h11, c11), tr(h11, c11)))),
    ));

  it('turns a header column into regular cells', () =>
    test(
      doc(table(tbody(tr(hCursor, h11), tr(h11, c11)))),
      toggleHeaderColumn,
      doc(table(tbody(tr(c11, h11), tr(c11, c11)))),
    ));

  it('turns a partial header column into regular cells', () =>
    test(
      doc(table(tbody(tr(hCursor, c11), tr(c11, c11)))),
      toggleHeaderColumn,
      doc(table(tbody(tr(c11, c11), tr(c11, c11)))),
    ));
});

describe('toggleHeader', () => {
  it('turns a header row with colspan and rowspan into a regular cell', () =>
    test(
      doc(
        p('x'),
        table(tbody(tr(h(2, 1), h(1, 2)), tr(cCursor, c11), tr(c11, c11, c11))),
      ),
      toggleHeader('row', { useDeprecatedLogic: false }),
      doc(
        p('x'),
        table(tbody(tr(c(2, 1), c(1, 2)), tr(cCursor, c11), tr(c11, c11, c11))),
      ),
    ));

  it('turns a header column with colspan and rowspan into a regular cell', () =>
    test(
      doc(
        p('x'),
        table(tbody(tr(h(2, 1), h(1, 2)), tr(cCursor, c11), tr(c11, c11, c11))),
      ),
      toggleHeader('column', { useDeprecatedLogic: false }),
      doc(
        p('x'),
        table(tbody(tr(h(2, 1), h(1, 2)), tr(h11, c11), tr(h11, c11, c11))),
      ),
    ));

  it('should keep first cell as header when the column header is enabled', () =>
    test(
      doc(p('x'), table(tbody(tr(h11, c11), tr(hCursor, c11), tr(h11, c11)))),
      toggleHeader('row', { useDeprecatedLogic: false }),
      doc(p('x'), table(tbody(tr(h11, h11), tr(h11, c11), tr(h11, c11)))),
    ));

  describe('new behavior', () => {
    it('turns a header column into regular cells without override header row', () =>
      test(
        doc(table(tbody(tr(hCursor, h11), tr(h11, c11)))),
        toggleHeader('column', { useDeprecatedLogic: false }),
        doc(table(tbody(tr(hCursor, h11), tr(c11, c11)))),
      ));
  });
});
