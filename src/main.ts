window.onload = (): void => {

    const editor: BittMappEditor = new BittMappEditor({
        canvas: document.getElementById("editor") as HTMLCanvasElement,
        canvasHeight: 640,
        canvasWidth: 640,
        height: 32,
        width: 32
    });

};
