import ist from 'ist';

import { table, tbody, thead, tfoot, tr, c, c11 } from './build';
import { Rect, TableMap } from '../src/';
import { describe, it } from 'vitest';

function eqRect(a: Rect, b: Rect) {
  return (
    a.left == b.left &&
    a.right == b.right &&
    a.top == b.top &&
    a.bottom == b.bottom
  );
}

describe('TableMap', () => {
  it('finds the right shape for a simple table', () => {
    ist(
      TableMap.get(
        table(
          thead(tr(c11, c11, c11)),
          tbody(
            tr(c11, c11, c11),
            tr(c11, c11, c11),
            tr(c11, c11, c11),
            tr(c11, c11, c11),
          ),
          tfoot(tr(c11, c11, c11)),
        ),
      ).map.join(', '),
      '2, 7, 12, 21, 26, 31, 38, 43, 48, 55, 60, 65, 72, 77, 82, 91, 96, 101',
    );
  });

  it('finds the right shape for colspans', () => {
    ist(
      TableMap.get(
        table(tbody(tr(c11, c(2, 1)), tr(c(2, 1), c11), tr(c11, c11, c11))),
      ).map.join(', '),
      '2, 7, 7, 14, 14, 19, 26, 31, 36',
    );
  });

  it('finds the right shape for rowspans', () => {
    ist(
      TableMap.get(table(tbody(tr(c(1, 2), c11, c(1, 2)), tr(c11)))).map.join(
        ', ',
      ),
      '2, 7, 12, 2, 19, 12',
    );
  });

  it('finds the right shape for deep rowspans', () => {
    ist(
      TableMap.get(
        table(tbody(tr(c(1, 4), c(2, 1)), tr(c(1, 2), c(1, 2)), tr())),
      ).map.join(', '),
      '2, 7, 7, 2, 14, 19, 2, 14, 19',
    );
  });

  it('finds the right shape for larger rectangles', () => {
    ist(
      TableMap.get(
        table(tbody(tr(c11, c(4, 4)), tr(c11), tr(c11), tr(c11))),
      ).map.join(', '),
      '2, 7, 7, 7, 7, 14, 7, 7, 7, 7, 21, 7, 7, 7, 7, 28, 7, 7, 7, 7',
    );
  });

  const map = TableMap.get(
    table(
      thead(tr(c11, c(3, 1))),
      tbody(tr(c(2, 3), c11, c(1, 2)), tr(c11), tr(c(2, 1))),
      tfoot(tr(c(1, 2), c11, c(2, 1)), tr(c(2, 1), c11)),
    ),
  );
  /*
  H11 H12 H12 H12
  B11 B11 B12 B13
  B11 B11 B21 B13
  B11 B11 B31 B31
  F11 F12 F13 F13
  F11 F21 F21 F22

  thead  2  7  7  7 
  tbody 16 16 21 26
  tbody 16 16 33 26
  tbody 16 16 40 40
  tfoot 49 54 59 59
  tfoot 49 66 66 71
  */

  it('can accurately find cell sizes', () => {
    ist(map.width, 4);
    ist(map.height, 6);
    ist(
      map.findCell(2),
      { left: 0, right: 1, top: 0, bottom: 1 },
      eqRect,
    ); /* H11 */
    ist(
      map.findCell(7),
      { left: 1, right: 4, top: 0, bottom: 1 },
      eqRect,
    ); /* H12 */
    ist(
      map.findCell(16),
      { left: 0, right: 2, top: 1, bottom: 4 },
      eqRect,
    ); /* B11 */
    ist(
      map.findCell(21),
      { left: 2, right: 3, top: 1, bottom: 2 },
      eqRect,
    ); /* B12 */
    ist(
      map.findCell(26),
      { left: 3, right: 4, top: 1, bottom: 3 },
      eqRect,
    ); /* B13 */
    ist(
      map.findCell(33),
      { left: 2, right: 3, top: 2, bottom: 3 },
      eqRect,
    ); /* B21 */
    ist(
      map.findCell(40),
      { left: 2, right: 4, top: 3, bottom: 4 },
      eqRect,
    ); /* B31 */
    ist(
      map.findCell(49),
      { left: 0, right: 1, top: 4, bottom: 6 },
      eqRect,
    ); /* F11 */
    ist(
      map.findCell(54),
      { left: 1, right: 2, top: 4, bottom: 5 },
      eqRect,
    ); /* F12 */
    ist(
      map.findCell(59),
      { left: 2, right: 4, top: 4, bottom: 5 },
      eqRect,
    ); /* F13 */
    ist(
      map.findCell(66),
      { left: 1, right: 3, top: 5, bottom: 6 },
      eqRect,
    ); /* F21 */
    ist(
      map.findCell(71),
      { left: 3, right: 4, top: 5, bottom: 6 },
      eqRect,
    ); /* F22 */
  });

  it('can find the rectangle between two cells', () => {
    ist(map.cellsInRect(map.rectBetween(2, 2)).join(', '), '2');
    ist(map.cellsInRect(map.rectBetween(2, 16)).join(', '), '2, 7, 16');
    ist(
      map.cellsInRect(map.rectBetween(7, 16)).join(', '),
      '2, 7, 16, 21, 26, 33, 40',
    );
    ist(map.cellsInRect(map.rectBetween(16, 21)).join(', '), '16, 21, 33, 40');
    ist(
      map.cellsInRect(map.rectBetween(16, 40)).join(', '),
      '16, 21, 26, 33, 40',
    );
    ist(map.cellsInRect(map.rectBetween(16, 16)).join(', '), '16');
    ist(map.cellsInRect(map.rectBetween(21, 40)).join(', '), '21, 26, 33, 40');
    ist(map.cellsInRect(map.rectBetween(21, 26)).join(', '), '21, 26, 33');
    ist(map.cellsInRect(map.rectBetween(26, 21)).join(', '), '21, 26, 33');
    ist(map.cellsInRect(map.rectBetween(33, 40)).join(', '), '33, 40');
    ist(map.cellsInRect(map.rectBetween(21, 33)).join(', '), '21, 33');
  });

  it('can find adjacent cells', () => {
    ist(map.nextCell(2, 'horiz', 1), 7);
    ist(map.nextCell(2, 'horiz', -1), null);
    ist(map.nextCell(2, 'vert', 1), 16);
    ist(map.nextCell(2, 'vert', -1), null);

    ist(map.nextCell(7, 'horiz', 1), null);
    ist(map.nextCell(7, 'horiz', -1), 2);
    ist(map.nextCell(7, 'vert', 1), 16);
    ist(map.nextCell(7, 'vert', -1), null);

    ist(map.nextCell(16, 'horiz', 1), 21);
    ist(map.nextCell(16, 'horiz', -1), null);
    ist(map.nextCell(16, 'vert', 1), 49);
    ist(map.nextCell(16, 'vert', -1), 2);

    ist(map.nextCell(21, 'horiz', 1), 26);
    ist(map.nextCell(21, 'horiz', -1), 16);
    ist(map.nextCell(21, 'vert', 1), 33);
    ist(map.nextCell(21, 'vert', -1), 7);

    ist(map.nextCell(33, 'horiz', 1), 26);
    ist(map.nextCell(33, 'horiz', -1), 16);
    ist(map.nextCell(33, 'vert', 1), 40);
    ist(map.nextCell(33, 'vert', -1), 21);

    ist(map.nextCell(40, 'horiz', 1), null);
    ist(map.nextCell(40, 'horiz', -1), 16);
    ist(map.nextCell(40, 'vert', 1), 59);
    ist(map.nextCell(40, 'vert', -1), 33);

    ist(map.nextCell(49, 'horiz', 1), 54);
    ist(map.nextCell(49, 'horiz', -1), null);
    ist(map.nextCell(49, 'vert', 1), null);
    ist(map.nextCell(49, 'vert', -1), 16);

    ist(map.nextCell(54, 'horiz', 1), 59);
    ist(map.nextCell(54, 'horiz', -1), 49);
    ist(map.nextCell(54, 'vert', 1), 66);
    ist(map.nextCell(54, 'vert', -1), 16);

    ist(map.nextCell(59, 'horiz', 1), null);
    ist(map.nextCell(59, 'horiz', -1), 54);
    ist(map.nextCell(59, 'vert', 1), 66);
    ist(map.nextCell(59, 'vert', -1), 40);

    ist(map.nextCell(66, 'horiz', 1), 71);
    ist(map.nextCell(66, 'horiz', -1), 49);
    ist(map.nextCell(66, 'vert', 1), null);
    ist(map.nextCell(66, 'vert', -1), 54);

    ist(map.nextCell(71, 'horiz', 1), null);
    ist(map.nextCell(71, 'horiz', -1), 66);
    ist(map.nextCell(71, 'vert', 1), null);
    ist(map.nextCell(71, 'vert', -1), 59);
  });
});
