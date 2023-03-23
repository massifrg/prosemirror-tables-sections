import ist from 'ist';
import { EditorState } from 'prosemirror-state';
import { describe, it } from 'vitest';

import {
  c,
  c11,
  cEmpty,
  doc,
  eq,
  h11,
  hEmpty,
  p,
  table,
  tbody,
  td,
  tfoot,
  thead,
  tr,
} from './build';

import { Node } from 'prosemirror-model';
import { fixTables, TableMap } from '../src/';
import { logNode, logTableMap } from './log';

const cw100 = td({ colwidth: [100] }, p('x'));
const cw150 = td({ colwidth: [150] }, p('x'));
const cw200 = td({ colwidth: [200] }, p('x'));

function fix(table: Node, debug: boolean = false) {
  const state = EditorState.create({ doc: doc(table) });
  if (debug) {
    logNode(state.doc, 'BEFORE fixTables:');
    logTableMap(TableMap.get(table));
  }
  const tr = fixTables(state);
  if (debug) {
    if (tr) {
      logNode(tr.doc, 'AFTER fixTables:');
      logTableMap(TableMap.get(tr.doc.nodeAt(0)!));
    }
  }
  return tr && tr.doc.firstChild;
}

describe('fixTable', () => {
  it("doesn't touch correct tables", () => {
    ist(fix(table(tbody(tr(c11, c11, c(1, 2)), tr(c11, c11)))), null);
  });

  it('adds trivially missing cells', () => {
    ist(
      fix(table(tbody(tr(c11, c11, c(1, 2)), tr(c11)))),
      table(tbody(tr(c11, c11, c(1, 2)), tr(c11, cEmpty))),
      eq,
    );
  });

  it('can add to multiple rows', () => {
    ist(
      fix(table(tbody(tr(c11), tr(c11, c11), tr(c(3, 1))))),
      table(tbody(tr(c11, cEmpty, cEmpty), tr(cEmpty, c11, c11), tr(c(3, 1)))),
      eq,
    );
  });

  it('will default to adding at the start of the first row', () => {
    ist(
      fix(table(tbody(tr(c11), tr(c11, c11)))),
      table(tbody(tr(cEmpty, c11), tr(c11, c11))),
      eq,
    );
  });

  it('will default to adding at the end of the non-first row', () => {
    ist(
      fix(table(tbody(tr(c11, c11), tr(c11)))),
      table(tbody(tr(c11, c11), tr(c11, cEmpty))),
      eq,
    );
  });

  it('will fix overlapping cells', () => {
    ist(
      fix(table(tbody(tr(c11, c(1, 2), c11), tr(c(2, 1))))),
      table(tbody(tr(c11, c(1, 2), c11), tr(c11, cEmpty, cEmpty))),
      eq,
    );
  });

  it('will fix a rowspan that sticks out of the table', () => {
    ist(
      fix(table(tbody(tr(c11, c11), tr(c(1, 2), c11)))),
      table(tbody(tr(c11, c11), tr(c11, c11))),
      eq,
    );
  });

  it('makes sure column widths are coherent', () => {
    ist(
      fix(table(tbody(tr(c11, c11, cw200), tr(cw100, c11, c11)))),
      table(tbody(tr(cw100, c11, cw200), tr(cw100, c11, cw200))),
      eq,
    );
  });

  it('makes sure column widths are coherent even across different sections', () => {
    ist(
      fix(
        table(
          thead(tr(c11, c11, cw200, c11)),
          tbody(tr(c11, cw150, c11, c11)),
          tfoot(tr(cw100, c11, c11, c11)),
        ),
      ),
      table(
        thead(tr(cw100, cw150, cw200, c11)),
        tbody(tr(cw100, cw150, cw200, c11)),
        tfoot(tr(cw100, cw150, cw200, c11)),
      ),
      eq,
    );
  });

  it('can update column widths on colspan cells', () => {
    ist(
      fix(table(tbody(tr(c11, c11, cw200), tr(c(3, 2)), tr()))),
      table(
        tbody(
          tr(c11, c11, cw200),
          tr(td({ colspan: 3, rowspan: 2, colwidth: [0, 0, 200] }, p('x'))),
          tr(),
        ),
      ),
      eq,
    );
  });

  it('will update the odd one out when column widths disagree', () => {
    ist(
      fix(
        table(
          tbody(
            tr(cw100, cw100, cw100),
            tr(cw200, cw200, cw100),
            tr(cw100, cw200, cw200),
          ),
        ),
      ),
      table(
        tbody(
          tr(cw100, cw200, cw100),
          tr(cw100, cw200, cw100),
          tr(cw100, cw200, cw100),
        ),
      ),
      eq,
    );
  });

  it('respects table role when inserting a cell', () => {
    ist(
      fix(table(tbody(tr(h11), tr(c11, c11), tr(c(3, 1))))),
      table(tbody(tr(h11, hEmpty, hEmpty), tr(cEmpty, c11, c11), tr(c(3, 1)))),
      eq,
    );
  });
});
