import ist from 'ist';
import { describe, it } from 'vitest';
import { TableMap } from '../src';
import { getRow } from '../src/util';
import { c11, caption, p, table, tbody, tfoot, thead, tr } from './build';

describe('getRow', () => {
  const t = table(
    caption(p('x')),
    thead(tr(c11, c11, c11)),
    tbody(
      tr(c11, c11, c11),
      tr(c11, c11, c11),
      tr(c11, c11, c11),
      tr(c11, c11, c11),
    ),
    tfoot(tr(c11, c11, c11)),
  );

  // logNode(t);

  it('finds every row', () => {
    ist(getRow(t, 0).pos, 6);
    ist(getRow(t, 1).pos, 25);
    ist(getRow(t, 2).pos, 42);
    ist(getRow(t, 3).pos, 59);
    ist(getRow(t, 4).pos, 76);
    ist(getRow(t, 5).pos, 95);
    ist(TableMap.get(t).sectionRows.join(', '), '1, 4, 1');
  });

  it("correctly determine section's index", () => {
    ist(getRow(t, 0).section, 0);
    ist(getRow(t, 1).section, 1);
    ist(getRow(t, 2).section, 1);
    ist(getRow(t, 3).section, 1);
    ist(getRow(t, 4).section, 1);
    ist(getRow(t, 5).section, 2);
    ist(getRow(t, 6).section, 2);
  });
});
