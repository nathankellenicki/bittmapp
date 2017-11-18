window.onload = function (): void {

    let editor: BittMappEditor = new BittMappEditor({
        canvas: <HTMLCanvasElement> document.getElementById("editor"),
        canvasWidth: 640,
        canvasHeight: 640,
        width: 32,
        height: 32
    });

};