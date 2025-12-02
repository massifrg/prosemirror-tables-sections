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
[model](https://hackage.haskell.org/package/pandoc-types-1.23.1/docs/Text-Pandoc-Definition.html),
but it's generic enough to support any table with an optional caption,
an optional head (`thead`), one or more table bodies (`tbody`)
and an optional foot (`tfoot`).

It defines four additional table roles: `head`, `body`, `foot` and `caption`.
The first three are "section roles".

The top-level directory contains a `demo.ts` and `index.html`, which
can be built with `npm run build_demo` or `yarn build_demo`
to show a simple demo of how the module can be used.

## Changelog

Version 0.6.3.

It fixes a nasty bug in the detection of table problems (e.g. missing or colliding cells),
that are then fixed by `fixTables`.

Version 0.6.1

Two commands have been added:

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

Version 0.6.0

The code goes back to the implementation
of `columnresizing.ts` and `tableview.ts` you find in the original
[prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables),
adapted to table sections.

Thanks to the people maintaining the original project,
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
   This function creates a set of [node
    * specs](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes) for
    * `table`, `table_caption`, `table_head`, `table_body`, `table_foot`,
    * `table_row`, `table_cell` and `table_header` nodes types as used
    * by this module.
    * The result can then be added to the set of nodes when
    * creating a schema.
    *
    * @public


 * **`tableEditing`**`(TableEditingOptions = {}) → Plugin`\
   Creates a [plugin](http://prosemirror.net/docs/ref/#state.Plugin)
    * that, when added to an editor, enables cell-selection, handles
    * cell-based copy/paste, and makes sure tables stay well-formed (each
    * row has the same width, and cells don't overlap).
    *
    * You should probably put this plugin near the end of your array of
    * plugins, since it handles mouse and arrow key events in tables
    * rather broadly, and other plugins, like the gap cursor or the
    * column-width dragging plugin, might want to get a turn first to
    * perform more specific behavior.
    *
    * @public


### class CellSelection extends Selection

A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
 * subclass that represents a cell selection spanning part of a table.
 * With the plugin enabled, these will be created when the user
 * selects across cells, and will be drawn by giving selected cells a
 * `selectedCell` CSS class.
 *
 * @public

 * `new `**`CellSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell)`

 * **`$anchorCell`**`: ResolvedPos`

 * **`$headCell`**`: ResolvedPos`

 * **`forEachCell`**`(f: fn(node: Node, pos: number))`

 * **`isColSelection`**`(tableMap?: TableMap) → boolean`

 * **`isRowSelection`**`() → boolean`

 * `static `**`colSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell) → CellSelection`

 * `static `**`rowSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell) → CellSelection`

 * `static `**`sectionSelection`**`($anchorCell: ResolvedPos, $headCell?: ResolvedPos = $anchorCell) → CellSelection`

 * `static `**`fromJSON`**`(doc: Node, json: CellSelectionJSON) → CellSelection`

 * `static `**`create`**`(doc: Node, anchorCell: number, headCell?: number = anchorCell) → CellSelection`


### Commands

The following commands can be used to make table-editing functionality
available to users.

 * **`addColumnBefore`**`(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Command to add a column before the column with the selection.
    *
    * @public


 * **`addColumnAfter`**`(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Command to add a column after the column with the selection.
    *
    * @public


 * **`deleteColumn`**`(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Command function that removes the selected columns from a table.
    *
    * @public


 * **`addRowBefore`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a table row before the selection.
    *
    * @public


 * **`addRowAfter`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a table row after the selection.
    *
    * @public


 * **`deleteRow`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Remove the selected rows from a table.
    *
    * @public


 * **`mergeCells`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Merge the selected cells into a single cell. Only available when
    * the selected cells' outline forms a rectangle.
    *
    * @public


 * **`splitCell`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Split a selected cell, whose rowpan or colspan is greater than one,
    * into smaller cells. Use the first cell type for the new cells.
    *
    * @public


 * **`splitCellWithType`**`(getCellType: fn(options: GetCellTypeOptions) → NodeType) → Command`\
   Split a selected cell, whose rowpan or colspan is greater than one,
    * into smaller cells with the cell type (th, td) returned by getType function.
    *
    * @public


 * **`setCellAttr`**`(name: string, value: unknown) → Command`\
   Returns a command that sets the given attribute to the given value,
    * and is only available when the currently selected cell doesn't
    * already have that attribute set to that value.
    *
    * @public


 * **`toggleHeaderRow`**`: Command`\
   Toggles whether the selected row contains header cells.
    *
    * @public


 * **`toggleHeaderColumn`**`: Command`\
   Toggles whether the selected column contains header cells.
    *
    * @public


 * **`toggleHeaderCell`**`: Command`\
   Toggles whether the selected cells are header cells.
    *
    * @public


 * **`toggleHeader`**`(type: ToggleHeaderType, options?: {useDeprecatedLogic: boolean}) → Command`\
   Toggles between row/column header and normal cells (Only applies to first row/column).
    * For deprecated behavior pass `useDeprecatedLogic` in options with true.
    *
    * @public


 * **`goToNextCell`**`(direction: Direction) → Command`\
   Returns a command for selecting the next (direction=1) or previous
    * (direction=-1) cell in a table.
    *
    * @public


 * **`deleteTable`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Deletes the table around the selection, if any.
    *
    * @public


### Utilities

 * **`fixTables`**`(state: EditorState, oldState?: EditorState) → Transaction | undefined`\
   Inspect all tables in the given state's document and return a
    * transaction that fixes them, if necessary. If `oldState` was
    * provided, that is assumed to hold a previous, known-good state,
    * which will be used to avoid re-scanning unchanged parts of the
    * document.
    *
    * @public


### class TableMap

A table map describes the structure of a given table. To avoid
 * recomputing them all the time, they are cached per table node. To
 * be able to do that, positions saved in the map are relative to the
 * start of the table, rather than the start of the document.
 *
 * @public

 * `new `**`TableMap`**`(width: number, height: number, map: number[], sectionRows: number[], problems: Problem[] | null)`

 * **`width`**`: number`\
   The number of columns

 * **`height`**`: number`\
   The number of rows

 * **`map`**`: number[]`\
   A width * height array with the start position of
        * the cell covering that part of the table in each slot

 * **`sectionRows`**`: number[]`\
   The number of rows of each table section

 * **`problems`**`: Problem[] | null`\
   An optional array of problems (cell overlap or non-rectangular
        * shape) for the table, used by the table normalizer.

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

 * `static `**`get`**`(table: Node) → TableMap`


### Unsorted

 * type **`TableRect`**
   ` = Rect & {tableStart: number, map: TableMap, table: Node}`\
   @public


 * **`selectedRect`**`(state: EditorState) → TableRect`\
   Helper to get the selected rectangle in a table, if any. Adds table
    * map, table node, and table start offset to the object for
    * convenience.
    *
    * @public


 * **`addColumn`**`(tr: Transaction, TableRect, col: number) → Transaction`\
   Add a column at the given position in a table.
    *
    * @public


 * **`removeColumn`**`(tr: Transaction, TableRect, col: number)`\
   @public


 * **`rowIsHeader`**`(map: TableMap, table: Node, row: number) → boolean`\
   @public


 * **`addRow`**`(tr: Transaction, TableRect, row: number) → Transaction`\
   @public


 * **`removeRow`**`(tr: Transaction, TableRect, row: number)`\
   @public


 * **`removeSection`**`(tr: Transaction, TableRect, section: number)`\
   @public


 * **`addCaption`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a caption to the table, if not already present.
    *
    * @public


 * **`deleteCaption`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Remove the caption from the table, if present.
    *
    * @public


 * **`addTableHead`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a head section to the table, if not already present.
    *
    * @public


 * **`addTableFoot`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a foot section to the table, if not already present.
    *
    * @public


 * **`addBodyBefore`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a body section before the first section touched by the selection.
    *
    * @public


 * **`addBodyAfter`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Add a body section after the first section touched by the selection.
    *
    * @public


 * **`makeBody`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Make a new body section of the selected rows.
    *
    * @public


 * **`makeHead`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Make a new body section of the selected rows.
    *
    * @public


 * **`makeFoot`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Make a new body section of the selected rows.
    *
    * @public


 * **`deleteSection`**`(state: EditorState, dispatch?: fn(tr: Transaction)) → boolean`\
   Delete selected table sections, even when partially selected.
    *
    * @public


### interface GetCellTypeOptions

@public

 * **`node`**`: Node`

 * **`row`**`: number`

 * **`col`**`: number`


 * type **`ToggleHeaderType`**
   ` = "column" | "row" | "cell"`\
   @public


 * **`setComputedStyleColumnWidths`**`(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Command function that sets the column widths to the values
    * obtained with window.getComputedStyle.
    * When the selection is a column selection, only the selected columns
    * get the computed values;
    * otherwise the inner table in the selection is the one whose cells
    * are assigned the computed width.
    *
    * @public


 * **`setRelativeColumnWidths`**`(relwidths: number[], minwidth?: number) → fn(state: EditorState, dispatch?: fn(tr: Transaction), view?: EditorView) → boolean`\
   Sets the column widths as fractions (range 0..1) of the whole table width.
    * If their sum is greater than one, you'll get a wider table.
    * The same will happen if you specify a minwidth and some fractions would result
    * in widths that are less than the minwidth.
    * @param relwidths column widths as fractions of the table width (in the range 0 to 1)
    * @param minwidth  minimum width of a column
    * @returns


### class CellBookmark

@public

 * `new `**`CellBookmark`**`(anchor: number, head: number)`

 * **`anchor`**`: number`

 * **`head`**`: number`

 * **`map`**`(mapping: Mappable) → CellBookmark`

 * **`resolve`**`(doc: Node) → CellSelection | Selection`


### interface CellSelectionJSON

@public

 * **`type`**`: string`

 * **`anchor`**`: number`

 * **`head`**`: number`


 * **`columnResizing`**`(ColumnResizingOptions = {}) → Plugin`\
   @public


 * **`columnResizingPluginKey`**`: PluginKey`\
   @public


### class ResizeState

@public

 * `new `**`ResizeState`**`(activeHandle: number, dragging: Dragging | false)`

 * **`activeHandle`**`: number`

 * **`dragging`**`: Dragging | false`

 * **`apply`**`(tr: Transaction) → ResizeState`


### type ColumnResizingOptions

@public

 * **`handleWidth`**`?: number`

 * **`cellMinWidth`**`?: number`

 * **`lastColumnResizable`**`?: boolean`

 * **`View`**`?: {new (node: Node, cellMinWidth: number, view: EditorView, getPos: fn() → number | undefined) → NodeView}`


### type Dragging

@public

 * **`startX`**`: number`

 * **`startWidth`**`: number`


 * type **`Direction`**
   ` = -1 | 1`\
   @public


 * **`tableNodeTypes`**`(schema: Schema) → Record`\
   @public


### interface CellAttributes

@public

 * **`default`**`: unknown`\
   The attribute's default value.

 * **`getFromDOM`**`?: getFromDOM`\
   A function to read the attribute's value from a DOM node.

 * **`setDOMAttr`**`?: setDOMAttr`\
   A function to add the attribute's value to an attribute
      * object that's used to render the cell's DOM.


 * type **`getFromDOM`**
   ` = fn(dom: HTMLElement) → unknown`\
   @public


 * type **`setDOMAttr`**
   ` = fn(value: unknown, attrs: MutableAttrs)`\
   @public


 * type **`TableNodes`**
   ` = Record`\
   @public


### interface TableNodesOptions

@public

 * **`tableGroup`**`?: string`\
   A group name (something like `"block"`) to add to the table
      * node type.

 * **`cellContent`**`: string`\
   The content expression for table cells.

 * **`cellAttributes`**`: Object`\
   Additional attributes to add to cells. Maps attribute names to
      * objects with the following properties:


 * type **`TableRole`**
   ` = "table" | "caption" | "head" | "body" | "foot" | "row" | "cell" | "header_cell"`\
   @public


 * type **`ColWidths`**
   ` = number[]`\
   @public


 * type **`Problem`**
   ` = {type: "colwidth mismatch", pos: number, colwidth: ColWidths} | {type: "collision", pos: number, row: number, n: number} | {type: "missing", row: number, n: number} | {type: "overlong_rowspan", pos: number, n: number}`\
   @public


### interface Rect

@public

 * **`left`**`: number`

 * **`top`**`: number`

 * **`right`**`: number`

 * **`bottom`**`: number`


 * **`addColSpan`**`(attrs: {colspan: number, rowspan: number, colwidth: number[] | null}, pos: number, n?: number = 1) → Attrs`\
   @public


 * **`cellAround`**`($pos: ResolvedPos) → ResolvedPos | null`\
   @public


 * **`colCount`**`($pos: ResolvedPos) → number`\
   @public


 * **`columnIsHeader`**`(map: TableMap, table: Node, col: number) → boolean`\
   @public


 * **`findCell`**`($pos: ResolvedPos) → Rect`\
   @public


 * **`getRow`**`(table: Node, row: number) → {node: Node | null, pos: number, section: number}`\
   returns an object with the node, the position and the section index of a row in a table


 * **`isInTable`**`(state: EditorState) → boolean`\
   @public


 * **`isRowLastInSection`**`(table: Node, row: number) → boolean`\
   returns true when the row is the last of a section in the table


 * **`moveCellForward`**`($pos: ResolvedPos) → ResolvedPos`\
   @public


 * **`nextCell`**`($pos: ResolvedPos, axis: "horiz" | "vert", dir: number) → ResolvedPos | null`\
   @public


 * **`pointsAtCell`**`($pos: ResolvedPos) → boolean`\
   @public


 * **`removeColSpan`**`(attrs: {colspan: number, rowspan: number, colwidth: number[] | null}, pos: number, n?: number = 1) → {colspan: number, rowspan: number, colwidth: number[] | null}`\
   @public


 * **`rowPos`**`(table: Node, row: number) → number`\
   the relative position of a row in a table


 * **`rowAtPos`**`(table: Node, pos: number) → number`\
   the index of the row at the specified relative position in the table


 * **`rowsCount`**`(table: Node) → number`\
   returns the number of rows of a table, without using its associated TableMap


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


 * type **`MutableAttrs`**
   ` = Record`\
   @public


 * **`handlePaste`**`(view: EditorView, _: ClipboardEvent, slice: Slice) → boolean`\
   @public


 * **`fixTablesKey`**`: PluginKey`\
   @public


 * **`tableEditingKey`**`: PluginKey`\
   @public


### type TableEditingOptions

@public

 * **`allowTableNodeSelection`**`?: boolean`


