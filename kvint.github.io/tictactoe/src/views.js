/**
 * CellView
 * @param model – cell model
 * @constructor
 */
function CellView(model) {
    PIXI.Container.call(this);
    this.model = model;
    this.hit = new PIXI.Graphics().beginFill(0, 0).drawRect(0, 0, CellView.CELL_WIDTH, CellView.CELL_HEIGHT).endFill();

    this.crossSign = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.zeroSign = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.activeSign = undefined;

    this.addChild(this.hit);
    this.addChild(this.zeroSign);
    this.addChild(this.crossSign);
    this.zeroSign.alpha = this.crossSign.alpha = 0.7;
    this.zeroSign.visible = this.crossSign.visible = false;
    this.hit.interactive = this.hit.buttonMode = true;

    this.onDown = function () {
        globals.game.hitCell(this.model, this);
    };
    this.setSelected(false);
    this.hit.on("pointerdown", this.onDown.bind(this));
}

CellView.CELL_WIDTH = 80;
CellView.CELL_HEIGHT = 90;
CellView.prototype = new PIXI.Container();
/**
 * Displays red or black sign. Depending on param.
 * @param selected: boolean
 */
CellView.prototype.setSelected = function (selected) {
    var suffix = selected ? "red" : "black";

    this.crossSign.texture = PIXI.utils.TextureCache["cross-" + suffix + ".svg"];
    this.zeroSign.texture = PIXI.utils.TextureCache["nought-" + suffix + ".svg"];

    this.crossSign.anchor.set(0.5);
    this.zeroSign.anchor.set(0.5);
    this.crossSign.position.set(CellView.CELL_WIDTH * 0.5, CellView.CELL_HEIGHT * 0.5);
    this.zeroSign.position.set(CellView.CELL_WIDTH * 0.5, CellView.CELL_HEIGHT * 0.5);

    if (this.activeSign) {
        TweenLite.killTweensOf(this.activeSign);
        TweenLite.fromTo(this.activeSign.scale, 0.2, {x: 0, y: 0}, {x: 1, y: 1, ease: Back.easeOut});
    }
};
/**
 * Displays correct sign on cell.
 */
CellView.prototype.update = function () {
    delete this.activeSign;
    this.zeroSign.visible = this.crossSign.visible = false;
    if (this.model.owner === CellModel.PLAYER_O) {
        this.activeSign = this.zeroSign;
    } else if (this.model.owner === CellModel.PLAYER_X) {
        this.activeSign = this.crossSign;
    }
    if (this.activeSign) {
        this.activeSign.visible = true;
        TweenLite.fromTo(this.activeSign.scale, 0.15, {x: 1.7, y: 1.7}, {x: 1, y: 1, ease: Back.easeInOut});
    }
};
CellView.prototype.destroy = function() {
    this.hit.off("pointerdown");
    PIXI.Container.prototype.destroy.call(this);
};

/**
 * GameView contains all the cells, background and container for cross lines.
 * @param gameFacade
 * @constructor
 */
function GameView(gameFacade) {
    PIXI.Container.call(this);
    this.gameFacade = gameFacade;
    this.cells = [];
    this.label = new PIXI.Text();
    this.gridContainer = new PIXI.Container();
    this.cellsContainer = new PIXI.Container();
    this.topContainer = new PIXI.Container();
    this.addChild(this.cellsContainer, this.gridContainer, this.topContainer, this.label);
    this.drawBackground();
    this.drawField();
}

GameView.prototype = new PIXI.Container();

GameView.prototype.displayText = function (text) {
    this.label.text = text;
    this.label.position.x = (this.gridContainer.width - this.label.width) * 0.5;

    var duration = 0.15;
    var toy = -this.label.height * 1.5;

    TweenLite.fromTo(this.label.position, duration, {y: 0}, {y: toy, ease: Back.easeOut});
    TweenLite.fromTo(this.label, duration, {alpha: 0}, {alpha: 1, ease: Back.easeOut});

};
/**
 * Draws the grid lines
 */
GameView.prototype.drawBackground = function () {
    var rows = this.gameFacade.model.rows;
    var column = this.gameFacade.model.column;

    function verticalLine() {
        var line = new PIXI.Sprite(PIXI.utils.TextureCache["line-black.svg"]);
        line.width = CellView.CELL_HEIGHT * rows;
        line.rotation = Math.PI / 2;
        line.alpha = 0.1;
        return line;
    }
    function horizontalLine() {
        var line = new PIXI.Sprite(PIXI.utils.TextureCache["line-black.svg"]);
        line.width = CellView.CELL_WIDTH * column;
        line.alpha = 0.1;
        return line;
    }
    var i, theLine;

    for (i = 1; i < rows; i++) {
        theLine = horizontalLine();
        theLine.position.set(0, CellView.CELL_HEIGHT * i);
        this.gridContainer.addChild(theLine);
    }

    for (i = 1; i < column; i++) {
        theLine = verticalLine();
        theLine.position.set(CellView.CELL_WIDTH * i, 0);
        this.gridContainer.addChild(theLine);
    }
};

/**
 * Getting the cell view from CellModel.
 * @param cell – CellModel
 * @returns {*} – CellView
 */
GameView.prototype.getCellView = function (cell) {
    return this.cells[cell.posX][cell.posY];
};
/**
 * Draw the field.
 */
GameView.prototype.drawField = function () {

    var field = this.gameFacade.model.field;

    for (var i = 0; i < field.length; i++) {
        this.cells[i] = [];
        for (var j = 0; j < field[i].length; j++) {
            var cell = new CellView(field[i][j]);
            cell.update();
            cell.position.set(i * CellView.CELL_WIDTH, j * CellView.CELL_HEIGHT);
            this.cellsContainer.addChild(cell);
            this.cells[i].push(cell);
        }
    }
};
/**
 * Clears the field.
 */
GameView.prototype.clearField = function () {
    for (var i = 0; i < this.cells.length; i++) {
        for (var j = 0; j < this.cells[i].length; j++) {
            this.cells[i][j].destroy();
        }
    }
    this.topContainer.removeChildren();
    this.cellsContainer.removeChildren();
};
/**
 * Clears and draws the field.
 */
GameView.prototype.redrawField = function () {
    this.clearField();
    this.drawField();
};
/**
 * Draws the line between cells.
 * @param from – the cell
 * @param to – the cell
 */
GameView.prototype.drawCrossLine = function (from, to) {
    var p1 = new PIXI.Point(from.x + CellView.CELL_WIDTH * 0.5, from.y + CellView.CELL_HEIGHT * 0.5);
    var p2 = new PIXI.Point(to.x + CellView.CELL_WIDTH * 0.5, to.y + CellView.CELL_HEIGHT * 0.5);

    // distance between points
    var distance = Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
    // angle between points
    var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    var line = new PIXI.Sprite(PIXI.utils.TextureCache["line-red.svg"]);
    line.position.copy(p1);
    line.rotation = angle;
    line.width = distance;
    this.topContainer.addChild(line);
};
/**
 * Displays all winning lines
 * @param winlines[number][CellModel] – winning lines
 */
GameView.prototype.displayWinning = function (winlines) {

    for (var i = 0; i < winlines.length; i++) {
        var winline = winlines[i];
        var firstCell = this.getCellView(winline[0]);
        var lastCell = this.getCellView(winline[winline.length - 1]);
        this.drawCrossLine(firstCell, lastCell);

        for (var j = 0; j < winline.length; j++) {
            var cell = this.getCellView(winline[j]);
            cell.setSelected(true);
        }
    }
};