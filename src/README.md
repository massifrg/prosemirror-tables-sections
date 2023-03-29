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

`prosemirror-tables` defines a custom
[TableView](https://github.com/ProseMirror/prosemirror-tables/blob/master/src/tableview.ts)
that creates the `colgroup` DOM element and manages the `style` attribute
of the `table` element.

`prosemirror-tables-sections` does not need a custom 
[EditorView](https://prosemirror.net/docs/ref/#view.EditorView).
`colgroup` and table's `style` are set through 
[Decorations](https://prosemirror.net/docs/ref/#view.Decorations).

The top-level directory contains a `demo.js` and `index.html`, which
can be built with `yarn build_demo` to show a simple demo of how the
module can be used.

## Current state

**BEWARE**: this module is still experimental.

Currently it lacks the commands to create a caption or new sections (head, body, foot).

The documentation below is still valid, but it should be completed
with some new methods.

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
