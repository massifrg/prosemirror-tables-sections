# ProseMirror table module with sections

This module defines a schema extension to support tables with
table caption, head, bodies and foot, rowspan/colspan support, 
a custom selection class for cell selections in such a table, 
a plugin to manage such selections and enforce
invariants on such tables, and a number of commands to work with
tables.

It's a fork of [prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables).

The goal of this module is a Prosemirror Node rendering the tables
of [Pandoc](https://pandoc.org)'s internal 
[model](https://hackage.haskell.org/package/pandoc-types-1.23/docs/Text-Pandoc-Definition.html),
but it's generic enough to support any table with an optional caption,
an optional head (`thead`), one or more table bodies (`tbody`)
and an optional foot (`tfoot`).

It defines four additional table roles: `head`, `body`, `foot` and `caption`.
The first three are "section roles".

The top-level directory contains a `demo.js` and `index.html`, which
can be built with `npm run build_demo` or `yarn build_demo`
to show a simple demo of how the module can be used.

## Version

This is version 0.6.3.

It fixes a nasty bug in the detection of table problems (e.g. missing or colliding cells),
that are then fixed by `fixTables`.

Since version 0.6.1, two commands have been added:

- `setComputedStyleColumnWidths`, that sets the cells widths of a table
  to the actual values you may have set with CSS.
  It uses [window.getComputedStyle](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
  to retrieve those widths.
  If there's a column selection, it sets the widths of the selected columns' cells only,
  otherwise it sets all the cells widths of the (inner) table in the selection.

- `setRelativeColumnWidths(widths: number[], minwidth?: number)`,
  that returns a [Command](https://prosemirror.net/docs/ref/#state.Command)
  to set the relative widths of the (inner) table in the selection.
  The relative widths must be in the range 0..1.
  
  The table width is the one obtained with [window.getComputedStyle](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle).
  The new cells will get a _col width_ = _rel width_ * _table width_.
  
  If you specify `minwidth`, the columns will not be narrower than that.

  If `widths.length` is greater than the number of columns, 
  the exceeding widths will be ignored.

  If `widths.length` is lesser than the number of columns,
  only the first column widths will be set.

The code of this version has been checked with the current version of
[prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables)
(resulting in a bug being fixed).

Since version 0.6.0 the code goes back to the implementation
of `columnresizing.ts` and `tableview.ts` you find in the original
[prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables),
adapted to table sections.

BTW, thanks to the people maintaining the original project,
in particular for the translation into Typescript, that let
me go back to the original implementation of column resizing.

## Known issues

When you copy a portion of a table and you paste, you'll get a table
with all the cells you copied, but they will be all in a table foot.

Anyway, you can correct it into a table body with the `makeBody` command.

## Documentation

The module's main file exports everything you need to work with it.
The first thing you'll probably want to do is create a table-enabled
schema. That's what `tableNodes` is for:

* **`tableNodes`**`(options: TableNodesOptions) → TableNodes`\
   This function creates a set of 
   [node specs](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes)
   for `table`, `table_caption`, `table_head`, `table_body`, `table_foot`,
   `table_row`, `table_cell` and `table_header` nodes types as used
   by this module.
   The result can then be added to the set of nodes when
   creating a schema.


* **`tableEditing`**`(TableEditingOptions = {}) → Plugin`\
   Creates a [plugin](http://prosemirror.net/docs/ref/#state.Plugin)
   that, when added to an editor, enables cell-selection, handles
   cell-based copy/paste, and makes sure tables stay well-formed
   (each row has the same width, and cells don't overlap).
   
   You should probably put this plugin near the end of your array of
   plugins, since it handles mouse and arrow key events in tables
   rather broadly, and other plugins, like the gap cursor or the
   column-width dragging plugin, might want to get a turn first to
   perform more specific behavior.


### class CellSelection extends Selection

A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
subclass that represents a cell selection spanning part of a table.
With the plugin enabled, these will be created when the user
selects across cells, and will be drawn by giving selected cells a
`selectedCell` CSS class.

 * `new ` **`CellSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell)`

 * **`$anchorCell`**`: ResolvedPos`

 * **`$headCell`**`: ResolvedPos`

 * **`forEachCell`**`(f: fn(node: Node, pos: number))`

 * **`isColSelection`**`(tableMap?: TableMap) → boolean`

 * **`isRowSelection`**`() → boolean`

 * `static ` **`colSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell) → CellSelection`

 * `static ` **`rowSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell) → CellSelection`

 * `static ` **`sectionSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell) → CellSelection`

 * `static ` **`fromJSON`**`(doc: Node, json: CellSelectionJSON) → CellSelection`

 * `static ` **`create`**`(doc: Node, anchorCell: number, headCell?: number = anchorCell) → CellSelection`


### Commands

The following commands can be used to make table-editing functionality
available to users.

* **`addColumnBefore`**`(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Command to add a column before the column with the selection.

* **`addColumnAfter`**`(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Command to add a column after the column with the selection.

* **`deleteColumn`**`(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Command function that removes the selected columns from a table.

* **`addRowBefore`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a table row before the selection.

* **`addRowAfter`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a table row after the selection.

* **`deleteRow`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Remove the selected rows from a table.

* **`addCaption`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a caption to the table, if not already present.

* **`deleteCaption`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Remove the caption from the table, if present.

* **`addTableHead`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a head section to the table, if not already present.

* **`addTableFoot`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a foot section to the table, if not already present.

* **`addBodyBefore`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a body section before the first section touched by the selection.

* **`addBodyAfter`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a body section after the first section touched by the selection.

* **`deleteSection`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Delete selected table sections, even when partially selected.

* **`makeBody`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Make a new table body with the rows in the selection.

* **`makeHead`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Make the table head with the rows in the selection (they must be the first rows).

* **`makeFoot`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Make the table foot with the rows in the selection (they must be the last rows).

* **`mergeCells`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Merge the selected cells into a single cell. Only available when
   the selected cells' outline forms a rectangle.

* **`splitCell`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Split a selected cell, whose rowpan or colspan is greater than one,
   into smaller cells. Use the first cell type for the new cells.

* **`splitCellWithType`**`(getCellType: fn(options: GetCellTypeOptions) → NodeType) → Command`\
   Split a selected cell, whose rowpan or colspan is greater than one,
   into smaller cells with the cell type (th, td) returned by getType function.

* **`setCellAttr`**`(name: string, value: unknown) → Command`\
   Returns a command that sets the given attribute to the given value,
   and is only available when the currently selected cell doesn't
   already have that attribute set to that value.

* **`toggleHeaderRow`**`: Command`\
   Toggles whether the selected row contains header cells.

* **`toggleHeaderColumn`**`: Command`\
   Toggles whether the selected column contains header cells.

* **`toggleHeaderCell`**`: Command`\
   Toggles whether the selected cells are header cells.

* **`goToNextCell`**`(direction: Direction) → Command`\
   Returns a command for selecting the next (`direction=1`) or previous
   (`direction=-1`) cell in a table.

* **`deleteTable`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Deletes the table around the selection, if any.

### Utilities

 * **`fixTables`**`(state: EditorState, oldState?: EditorState) → Transaction | undefined`\
   Inspect all tables in the given state's document and return a
   transaction that fixes them, if necessary. If `oldState` was
   provided, that is assumed to hold a previous, known-good state,
   which will be used to avoid re-scanning unchanged parts of the
   document.

### class TableMap

A table map describes the structure of a given table. To avoid
recomputing them all the time, they are cached per table node. To
be able to do that, positions saved in the map are relative to the
start of the table, rather than the start of the document.

* `new ` **`TableMap`**`(width: number, height: number, map: number[], sectionRows: number[], problems: Problem[] | null)`

* **`width`**`: number`\
   The number of columns

* **`height`**`: number`\
   The number of rows

* **`map`**`: number[]`\
   A width * height array with the start position of
   the cell covering that part of the table in each slot

* **`sectionRows`**`: number[]`\
   The number of rows of each table section

* **`problems`**`: Problem[] | null`\
   An optional array of problems (cell overlap or non-rectangular
   shape) for the table, used by the table normalizer.

* **`findCell`**`(pos: number) → Rect`

* **`colCount`**`(pos: number) → number`

* **`nextCell`**`(pos: number, axis: "horiz" | "vert", dir: number) → number | null`

* **`rectBetween`**`(a: number, b: number) → Rect`

* **`cellsInRect`**`(rect: Rect) → number[]`

* **`sectionsInRect`**`(rect: Rect) → number[]`

* **`isLastRowInSection`**`(row: number) → boolean`

* **`positionAt`**`(row: number, col: number, table: Node) → number`

* **`findSection`**`(pos: number) → Rect`

* **`sectionOfRow`**`(row: number) → number`

* **`rectOverOneSection`**`(rect: Rect) → boolean`

* `static` **`get`**`(table: Node) → TableMap`

### Utility functions

* **`getRow`**`(table: Node, row: number) → {node: Node | null, pos: number, section: number}`\
   returns an object with the node, the position and the section index of a row in a table

* **`isRowLastInSection`**`(table: Node, row: number) → boolean`\
   returns true when the row is the last of a section in the table

* **`rowPos`**`(table: Node, row: number) → number`\
   the relative position of a row in a table

* **`rowAtPos`**`(table: Node, pos: number) → number`\
   the index of the row at the specified relative position in the table

* **`rowsCount`**`(table: Node) → number`\
   returns the number of rows of a table, without using its associated `TableMap`

* **`tableBodiesCount`**`(table: Node) → number`\
   returns the number of bodies in the table

* **`tableHasCaption`**`(table: Node) → boolean`\
   returns true when the table has a caption

* **`tableHasFoot`**`(table: Node) → boolean`\
   returns true if the table has a foot

* **`tableHasHead`**`(table: Node) → boolean`\
   returns true if the table has a head

* **`tableSectionsCount`**`(table: Node) → number`\
   returns the number of sections (head, bodies, foot) in the table
