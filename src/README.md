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

@tableNodes

@tableEditing

@CellSelection

### Commands

The following commands can be used to make table-editing functionality
available to users.

@addColumnBefore

@addColumnAfter

@deleteColumn

@addRowBefore

@addRowAfter

@deleteRow

@mergeCells

@splitCell

@splitCellWithType

@setCellAttr

@toggleHeaderRow

@toggleHeaderColumn

@toggleHeaderCell

@toggleHeader

@goToNextCell

@deleteTable

### Utilities

@fixTables

@TableMap

### Unsorted

@TableRect

@selectedRect

@addColumn

@removeColumn

@rowIsHeader

@addRow

@removeRow

@removeSection

@addCaption

@deleteCaption

@addTableHead

@addTableFoot

@addBodyBefore

@addBodyAfter

@makeBody

@makeHead

@makeFoot

@deleteSection

@GetCellTypeOptions

@ToggleHeaderType

@setComputedStyleColumnWidths

@setRelativeColumnWidths

@CellBookmark

@CellSelectionJSON

@columnResizing

@columnResizingPluginKey

@ResizeState

@ColumnResizingOptions

@Dragging

@Direction

@tableNodeTypes

@CellAttributes

@getFromDOM

@setDOMAttr

@TableNodes

@TableNodesOptions

@TableRole

@ColWidths

@Problem

@Rect

@addColSpan

@cellAround

@colCount

@columnIsHeader

@findCell

@getRow

@isInTable

@isRowLastInSection

@moveCellForward

@nextCell

@pointsAtCell

@removeColSpan

@rowPos

@rowAtPos

@rowsCount

@tableBodiesCount

@tableHasCaption

@tableHasFoot

@tableHasHead

@tableSectionsCount

@MutableAttrs

@handlePaste

@fixTablesKey

@tableEditingKey

@TableEditingOptions
