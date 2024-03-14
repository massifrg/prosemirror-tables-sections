import ist from 'ist';
import { EditorState } from 'prosemirror-state';
import { handleDecorations } from '../src/columnresizing';
import { table, doc, tr, cEmpty, tbody } from './build';
import { describe, it } from 'vitest';
import { DecorationSet } from 'prosemirror-view';

describe('handleDecorations', () => {
  it('returns an empty array (Decoration[]) if cell is null or undefined', () => {
    const state = EditorState.create({
      doc: doc(table(tbody(tr(/* 2*/ cEmpty, /* 6*/ cEmpty, /*10*/ cEmpty)))),
    });
    // @ts-expect-error: null is not a valid number
    const decoSet = handleDecorations(state, null);
    ist(decoSet instanceof DecorationSet && decoSet.find(undefined, undefined, () => true).length === 0)
  });
});
