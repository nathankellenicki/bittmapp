interface IBittMappEditorConstructorOptions {
    canvas: HTMLCanvasElement;
    canvasWidth: number;
    canvasHeight: number;
    width: number;
    height: number;
}


enum MouseButton {
    LEFT = 0,
    RIGHT = 2
}


enum Mode {
    PENCIL = 0,
    ERASER = 1,
    SELECTION = 2
}


class BittMappEditor {


    public canvasWidth: number;
    public canvasHeight: number;
    public canvas: HTMLCanvasElement;

    private _context: CanvasRenderingContext2D;

    private _width: number;
    private _height: number;
    private _scale: number;
    private _deviceRatio: number;

    private _pixelWidth: number = 0;
    private _pixelHeight: number = 0;

    private _mouseDown: boolean = false;
    private _mouseButton: MouseButton;

    private _selectionStartX: number = 0;
    private _selectionStartY: number = 0;
    private _selectionEndX: number = 0;
    private _selectionEndY: number = 0;

    private _editorMode: Mode = Mode.PENCIL;

    private _downloadHelper: HTMLAnchorElement;

    private _data: Uint8Array;
    private _selection: Uint8Array;


    constructor (options: IBittMappEditorConstructorOptions) {

        options = options || {};

        if (options.canvas) {
            this.canvas = options.canvas;
        } else {
            throw new Error("BittMappEditor must be initialized with a canvas.");
        }

        if (options.canvasWidth) {
            this.canvasWidth = options.canvasWidth;
        } else {
            throw new Error("BittMappEditor must be constructed with a canvasWidth.");
        }

        if (options.canvasHeight) {
            this.canvasHeight = options.canvasHeight;
        } else {
            throw new Error("BittMappEditor must be constructed with a canvasHeight.");
        }

        if (options.width) {
            this._width = options.width;
        } else {
            throw new Error("BittMappEditor must be constructed with a width.");
        }

        if (options.height) {
            this._height = options.height;
        } else {
            throw new Error("BittMappEditor must be constructed with a height.");
        }

        this._context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        const deviceRatio: number = window.devicePixelRatio || 1;
        const backingStoreRatio: number = (this._context as any).backingStorePixelRatio as number || 1;

        this._scale = deviceRatio / backingStoreRatio;
        this._deviceRatio = deviceRatio;

        this.canvas.width = this.canvasWidth * this._scale;
        this.canvas.height = this.canvasHeight * this._scale;
        this.canvas.style.width = `${this.canvasWidth}px`;
        this.canvas.style.height = `${this.canvasHeight}px`;

        this._context.scale(this._scale, this._scale);

        this._data = new Uint8Array((this._width / 8) * this._height);
        this._selection = new Uint8Array((this._width / 8) * this._height);

        this.resize();

        this.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        this.canvas.addEventListener("mousedown", (event) => {
            this._mouseDown = true;
            this._mouseButton = event.button as MouseButton;
            this._selectionStartX = this._calculateXFromMouseCoords(event.offsetX);
            this._selectionStartY = this._calculateYFromMouseCoords(event.offsetY);
            this._selectionEndX = this._selectionStartX + 1;
            this._selectionEndY = this._selectionStartY + 1;
            // NK: Only wipe selection if Ctrl isn't pressed
            this._selection = new Uint8Array((this._width / 8) * this._height);
            this._handleMouseEvent(event, this._mouseButton);
        });

        this.canvas.addEventListener("mousemove", (event) => {
            if (this._mouseDown) {
                this._handleMouseEvent(event, this._mouseButton);
            }
        });

        this.canvas.addEventListener("mouseup", (event) => {
            this._mouseDown = false;
        });

        this._downloadHelper = document.createElement("a");
        document.body.appendChild(this._downloadHelper);
        (this._downloadHelper as any).style = "display: none";

    }


    public pencilMode () {
        this._selection = new Uint8Array((this._width / 8) * this._height);
        this._editorMode = Mode.PENCIL;
        this._redraw();
    }


    public eraserMode () {
        this._selection = new Uint8Array((this._width / 8) * this._height);
        this._editorMode = Mode.ERASER;
        this._redraw();
    }


    public selectionMode () {
        this._editorMode = Mode.SELECTION;
        this._redraw();
    }


    public setPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        this._data[byte] = this._data[byte] |= mask;
    }


    public unsetPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        this._data[byte] = this._data[byte] &= ~mask;
    }


    public selectPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        this._selection[byte] = this._selection[byte] |= mask;
    }


    public deselectPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        this._selection[byte] = this._selection[byte] &= ~mask;
    }


    public deselectAll (): void {
        this._selection = new Uint8Array((this._width / 8) * this._height);
    }


    public resize (width: number = this._width, height: number = this._height): void {
        // TODO: Resize the data buffer
        this._width = width;
        this._height = height;
        this._pixelWidth = this.canvasWidth / width;
        this._pixelHeight = this.canvasHeight / height;
        this._redraw();
    }


    public loadFromData (data: Uint8Array, width: number, height: number) {
        this._data = data;
        this.resize(width, height);
    }


    public saveToFile (filename: string) {
        const blob: Blob = new Blob([this._data], {type: "octet/stream"});
        const url: string = window.URL.createObjectURL(blob);
        this._downloadHelper.href = url;
        this._downloadHelper.download = filename;
        this._downloadHelper.click();
        window.URL.revokeObjectURL(url);
    }


    get height (): number {
        return this._height;
    }


    set height (height: number) {
        this.resize(this._width, height);
    }


    get width (): number {
        return this._width;
    }


    set width (width: number) {
        this.resize(width, this._height);
    }


    private _calculateByteFromCoords (x: number, y: number): number {
        return Math.floor(((y * this._width) + x) / 8);
    }


    private _calculateByteMask (x: number) {
        return 1 << (x % 8);
    }


    private _calculateXFromMouseCoords (mouseX: number, round: any = Math.floor): number {
        return round(mouseX / this._pixelWidth);
    }


    private _calculateYFromMouseCoords (mouseY: number, round: any = Math.floor): number {
        return round(mouseY / this._pixelHeight);
    }


    private _handleMouseEvent (event: MouseEvent, button: number): void {

        let mouseX: number = this._calculateXFromMouseCoords(event.offsetX);
        let mouseY: number = this._calculateYFromMouseCoords(event.offsetY);

        switch (this._editorMode) {
            case Mode.PENCIL:

                if (button === MouseButton.LEFT) {
                    this.setPixel(mouseX, mouseY);
                } else if (button === MouseButton.RIGHT) {
                    this.unsetPixel(mouseX, mouseY);
                }

                break;
            case Mode.ERASER:

                if (button === MouseButton.LEFT) {
                    this.unsetPixel(mouseX, mouseY);
                } else if (button === MouseButton.RIGHT) {
                    this.setPixel(mouseX, mouseY);
                }

                break;
            case Mode.SELECTION:

                // Only do this if Ctrl isn't pressed
                mouseX = this._calculateXFromMouseCoords(event.offsetX, Math.ceil);
                mouseY = this._calculateYFromMouseCoords(event.offsetY, Math.ceil);

                this._selection = new Uint8Array((this._width / 8) * this._height);
                this._selectionEndX = mouseX;
                this._selectionEndY = mouseY;

                for (let x: number = this._selectionStartX; x < this._selectionEndX; x++) {
                    for (let y: number = this._selectionStartY; y < this._selectionEndY; y++) {
                        this.selectPixel(x, y);
                    }
                }

                break;
        }

        this._redraw();

    }


    private _isSelected (x: number, y: number): boolean {
        if (x < 0 || y < 0) {
            return false;
        } else if (x > this._width - 1 || y > this._height - 1) {
            return false;
        }

        const byte: number = this._calculateByteFromCoords(x, y);
        const mask: number = this._calculateByteMask(x);

        if ((this._selection[byte] & mask) >= 1) {
            return true;
        }

        return false;

    }


    private _redraw (): void {
        this._drawGrid();
        this._drawPixels();
        if (this._editorMode === Mode.SELECTION) {
            this._drawSelection();
        }
    }


    private _drawGrid (): void {

        this._context.fillStyle = "#FFFFFF";
        this._context.strokeStyle = "#CCCCCC";
        this._context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        this._context.beginPath();
        this._context.moveTo(0, 0);
        this._context.lineTo(this.canvasWidth, 0);
        this._context.stroke();

        this._context.beginPath();
        this._context.moveTo(0, 0);
        this._context.lineTo(0, this.canvasHeight);
        this._context.stroke();

        for (let i: number = 0; i < (this._width); i++) {

            const x: number = Math.floor((this.canvasWidth / this._width) * (i + 1));

            this._context.beginPath();
            this._context.moveTo(x, 0);
            this._context.lineTo(x, this.canvasHeight);
            this._context.stroke();

        }

        for (let j: number = 0; j < (this._height); j++) {

            const y: number = Math.floor((this.canvasHeight / this._height) * (j + 1));

            this._context.beginPath();
            this._context.moveTo(0, y);
            this._context.lineTo(this.canvasWidth, y);
            this._context.stroke();

        }

    }


    private _drawPixels (): void {

        this._context.fillStyle = "#000000";
        this._context.strokeStyle = "#FFFFFFF";

        for (let i: number = 0; i < this._height; i++) {
            for (let j: number = 0; j < (this._width / 8); j++) {

                let byte: number = this._data[(i * (this._width / 8)) + j];

                for (let k: number = 0; k < 8; k++) {
                    if (byte & 1) {

                        const startX: number = 0.5 + (((j * 8) + k) * this._pixelWidth);
                        const startY: number = 0.5 + (i * this._pixelHeight);

                        this._context.fillRect(startX, startY, this._pixelWidth - 1, this._pixelHeight - 1);

                    }
                    byte = byte >> 1;
                }

            }
        }

    }


    private _drawSelection (): void {

        this._context.strokeStyle = "#FF0000";

        for (let x: number = 0; x < this._width; x++) {
            for (let y: number = 0; y < this._height; y++) {

                const byte: number = this._calculateByteFromCoords(x, y);
                const mask: number = this._calculateByteMask(x);

                if (this._isSelected(x, y)) {

                    if (!this._isSelected(x - 1, y)) {
                        this._context.beginPath();
                        this._context.moveTo(x * this._pixelWidth, y * this._pixelHeight);
                        this._context.lineTo(x * this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.stroke();
                    }

                    if (!this._isSelected(x, y - 1)) {
                        this._context.beginPath();
                        this._context.moveTo(x * this._pixelWidth, y * this._pixelHeight);
                        this._context.lineTo((x * this._pixelWidth) + this._pixelWidth, y * this._pixelHeight);
                        this._context.stroke();
                    }

                    if (!this._isSelected(x + 1, y)) {
                        this._context.beginPath();
                        this._context.moveTo((x * this._pixelWidth) + this._pixelWidth, y * this._pixelHeight);
                        this._context.lineTo((x * this._pixelWidth) + this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.stroke();
                    }

                    if (!this._isSelected(x, y + 1)) {
                        this._context.beginPath();
                        this._context.moveTo(x * this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.lineTo((x * this._pixelWidth) + this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.stroke();
                    }

                }

            }
        }

    }


}
