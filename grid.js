const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.base.Base;
const HighlightedArea = Me.imports.highlight.HighlightedArea;


var Grid = class Grid extends Base {
  constructor({ boundingRect, settings }) {
    super();
    this._settings = settings;
    this.setBoundingRect(boundingRect);
  }

  setBoundingRect({ x, y, width, height}) {
    const { gap } = this.getGridSettings();

    this._boundingRect = { x, y, width, height };
    this._innerRect = {
      x: x + gap / 2,
      y: y + gap / 2,
      width: width - gap,
      height: height - gap,
    };
  }

  getBoundingRect() {
    return { ...this._boundingRect };
  }

  getGridSettings() {
    const [rows, columns, gap] = this._settings.getValues('grid-rows', 'grid-columns', 'grid-gap');
    return { rows, columns, gap };
  }

  snapXtoGrid(x) {
    const { width, x: offset } = this._innerRect;
    const { columns } = this.getGridSettings();

    const cellWidth = width / columns;
    const columnsOfX = Math.round((x - offset) / cellWidth);
    const snappedX = columnsOfX * cellWidth + offset;

    return snappedX;
  }

  snapYtoGrid(y) {
    const { height, y: offset } = this._innerRect;
    const { rows } = this.getGridSettings();

    const cellHeight = height / rows;
    const rowsOfY = Math.round((y - offset) / cellHeight);
    const snappedY = rowsOfY * cellHeight + offset;

    return snappedY;
  }

  snapRectToGrid({ x, y, width, height }) {
    const { gap } = this.getGridSettings();

    const snappedX = this.snapXtoGrid(x) + gap / 2;
    const snappedY = this.snapYtoGrid(y) + gap / 2;

    const snappedWidth = this.snapXtoGrid(width + x) - snappedX - gap / 2;
    const snappedHeight = this.snapYtoGrid(height + y) - snappedY - gap / 2;

    return {
      x: snappedX,
      y: snappedY,
      width: snappedWidth,
      height: snappedHeight
    };
  }

  screenToGrid(rect) {
    const { rows: gridRows, columns: gridColumns, gap } = this.getGridSettings();
    const { x, y, width, height } = this.snapRectToGrid(rect);

    const cellWidth = this._innerRect.width / gridColumns;
    const cellHeight = this._innerRect.height / gridRows;

    const left = Math.round((x - this._innerRect.x) / cellWidth);
    const top = Math.round((y - this._innerRect.y) / cellHeight);
    const columns = Math.round(width / cellWidth);
    const rows = Math.round(height / cellHeight);

    return { left, top, columns, rows };
  }

  gridToScreen({ left, top, columns, rows }) {
    const { rows: gridRows, columns: gridColumns, gap } = this.getGridSettings();

    const cellWidth = this._innerRect.width / gridColumns;
    const cellHeight = this._innerRect.height / gridRows;

    const x = this._innerRect.x + left * cellWidth + gap / 2;
    const y = this._innerRect.y + top * cellHeight + gap / 2;
    const width = columns * cellWidth - gap;
    const height = rows * cellHeight - gap;

    return { x, y, width, height };
  }
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var GridDisplay = class GridDisplay extends Base {
  constructor({ grid }) {
    super();

    if (grid)
      this.update(grid);
  }

  destroy() {
    this._highlights.forEach(highlight => highlight.destroy());
    this._highlights = null;
  }

  update(grid) {
    const { rows, columns } = grid.getGridSettings();

    if (this._highlights)
      this._highlights.forEach(h => h.destroy());

    this._highlights = [];
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < columns; col++)
        this._highlights.push(
          new HighlightedArea({
            ...grid.gridToScreen({ left: col, top: row, columns: 1, rows: 1 })
          })
        );
  }

  show() {
    this._highlights.forEach(highlight => highlight.show());
  }

  hide() {
    this._highlights.forEach(highlight => highlight.hide());
  }

  toggle() {
    this._highlights.forEach(highlight => highlight.toggle());
  }
};