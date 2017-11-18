interface BittMappEditorConstructorOptions {
    canvas: HTMLCanvasElement,
    canvasWidth: number,
    canvasHeight: number,
    width: number,
    height: number
}


class BittMappEditor {


    public canvasWidth: number;
    public canvasHeight: number;

    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;

    private _width: number;
    private _height: number;
    private _scale: number;
    private _deviceRatio: number;

    private _pixelWidth: number = 0;
    private _pixelHeight: number = 0;

    private _mouseDown: boolean = false;
    private _mouseButton: number;

    private _data: Uint8Array;


    constructor (options: BittMappEditorConstructorOptions) {

        options = options || {};

        if (options.canvas) {
            this._canvas = options.canvas;
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

        this._context = <CanvasRenderingContext2D> this._canvas.getContext("2d");

        const deviceRatio: number = window.devicePixelRatio,
            backingStoreRatio: number = <number> (this._context as any).backingStorePixelRatio || 1;

        this._scale = deviceRatio / backingStoreRatio;
        this._deviceRatio = deviceRatio;

        this._canvas.width = this.canvasWidth * this._scale;
        this._canvas.height = this.canvasHeight * this._scale;
        this._canvas.style.width = `${this.canvasWidth}px`;
        this._canvas.style.height = `${this.canvasHeight}px`;

        this._context.setTransform(this._scale, 0, 0, this._scale, 0, 0);

        this.resize();

        this._canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        this._canvas.addEventListener("mousedown", (event) => {
            this._mouseDown = true;
            this._mouseButton = event.button;
            this._handleMouseEvent(event, this._mouseButton);
        });

        this._canvas.addEventListener("mousemove", (event) => {
            if (this._mouseDown) {
                this._handleMouseEvent(event, this._mouseButton);
            }
        });

        this._canvas.addEventListener("mouseup", (event) => {
            this._mouseDown = false;
        });

    }


    setPixel (x: number, y: number): void {
        const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8)),
            mask: number = 1 << (x % 8);
        this._data[byte] = this._data[byte] |= mask;
    }


    unsetPixel (x: number, y: number): void {
        const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8)),
            mask: number = 1 << (x % 8);
        this._data[byte] = this._data[byte] &= ~mask;
    }


    resize (width: number = this._width, height: number = this._height): void {
        this._data = new Uint8Array((width / 8) * height);
        this._pixelWidth = this.canvasWidth / this._width;
        this._pixelHeight = this.canvasHeight / this._height;
        this._redraw();
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

    
    _handleMouseEvent (event: MouseEvent, button: number): void {

        const pixelX: number = Math.floor(event.offsetX / this._pixelWidth),
            pixelY: number = Math.floor(event.offsetY / this._pixelHeight);

        if (button === 0) {
            this.setPixel(pixelX, pixelY);
        } else if (button === 2) {
            this.unsetPixel(pixelX, pixelY);
        }

        this._redraw();
    
    }


    _redraw (): void {
        this._drawGrid();
        this._drawPixels();
    }


    _drawGrid (): void {

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


    _drawPixels (): void {

        console.log(this.width);

        this._context.fillStyle = "#000000";
        this._context.strokeStyle = "#FFFFFFF";

        for (let i: number = 0; i < this._height; i++) {
            for (let j: number = 0; j < (this._width / 8); j++) {

                let byte: number = this._data[(i * (this._width / 8)) + j];

                for (let k: number = 0; k < 8; k++) {
                    if (byte & 1) {
    
                        this._context.fillRect(0.5 + (((j * 8) + k) * this._pixelWidth), 0.5 + (i * this._pixelHeight), this._pixelWidth - 1, this._pixelHeight - 1);
    
                    }
                    byte = byte >> 1;
                }

            }
        }

    }
    

}