import { Fragment, Node, Slice } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import { TableMap } from '../src/tablemap';
import { Area } from '../src/copypaste';
import { CellSelection } from '../src';

export function logNode(
  t: Node,
  title?: string,
  onlyTableElements: boolean = true,
) {
  if (title) console.log(title);
  t.descendants((n, p) => {
    const tn = n.type.name;
    if (!onlyTableElements || tn.startsWith('table')) {
      const role: string | undefined = (n.type.spec as Record<string, any>)
        .tableRole;
      if (role === 'cell' || role === 'header_cell') {
        console.log(
          `${n.type.name}(${n.attrs.colspan},${
            n.attrs.rowspan
          }) @ ${p}, size: ${n.nodeSize}, colwidth=${
            n.attrs.colwidth || 'auto'
          }`,
        );
      } else {
        const text = n.type.name === 'text' ? n.textContent : undefined;
        console.log(
          `${n.type.name} @ ${p}, size: ${n.nodeSize}${
            text ? ' "' + text + '"' : ''
          }`,
        );
      }
    }
    return true;
  });
}

export function logFragment(f: Fragment, title?: string) {
  if (title) console.log(title);
  f.forEach((n, offset) => {
    const role: string | undefined = (n.type.spec as Record<string, any>)
      .tableRole;
    if (role === 'cell' || role === 'header_cell') {
      console.log(
        `${n.type.name}(${n.attrs.colspan},${n.attrs.rowspan}) @ ${offset}`,
      );
    } else {
      console.log(`${n.type.name} @ ${offset}`);
    }
  });
}

export function logArea(a: Area) {
  console.log(`AREA ${a.width}x${a.height}`);
  a.rows.forEach((r) => {
    logFragment(r);
  });
  console.log();
}

export function logSlice(s: Slice) {
  console.log(`SLICE openStart=${s.openStart}, openEnd=${s.openEnd}`);
  logFragment(s.content);
}

export function logTableMap(tableMap: TableMap) {
  const { height, map, sectionRows, width } = tableMap;
  for (let r = 0; r < height; r++) {
    console.log(map.slice(r * width, width * (r + 1)).join(', '));
  }
  console.log(`Rows per section: [${sectionRows.join()}]`);
  if (tableMap.problems) {
    tableMap.problems.forEach((p) => {
      console.log(`PROBLEM ${p.type}: ${JSON.stringify(p)}`);
    });
  }
}

export function logSelection(sel: Selection, name: string = '') {
  console.log(
    `${name}: SELECTION "${sel.content()}", anchor=${sel.anchor}, head=${
      sel.head
    }`,
  );
  if (sel instanceof CellSelection) {
    console.log(
      `${name}: SELECTION "${sel.content()}", anchor=${sel.anchor}, head=${
        sel.head
      } anchorCell@${sel.$anchorCell.pos} headCell@${sel.$headCell.pos}`,
    );
  }
}
