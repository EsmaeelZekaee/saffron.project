import { getCachedPdf } from './pdf-cache.js';

export const PDFEditor = {
  pdfDoc: null,
  pdfCanvas: null,
  fabricCanvas: null,
  fabricCanvasElement: null,

  init(fabric, pdfjsLib) {
    this.fabric = fabric;
    this.pdfjsLib = pdfjsLib;
    this.pdfCanvas = document.getElementById('pdf-canvas');
    this.fabricCanvasElement = document.getElementById('fabric-canvas');
    this.fabricCanvas = new fabric.Canvas('fabric-canvas');

    this.setupMessageListener();
    this.loadFromQuery();
  },

  getA4SizePixels() {
    const inchToPx = 96 * window.devicePixelRatio;
    const widthInPx = 8.27 * inchToPx;
    const heightInPx = 11.69 * inchToPx;
    return { widthInPx, heightInPx };
  },

  resizeCanvases(width, height) {
    this.pdfCanvas.width = width;
    this.pdfCanvas.height = height;
    this.fabricCanvasElement.width = width;
    this.fabricCanvasElement.height = height;
    this.fabricCanvas.setWidth(width);
    this.fabricCanvas.setHeight(height);
  },

  sendToParent(data) {
    window.parent.postMessage(data, '*');
  },

  async loadFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const fileUrl = params.get('file');

    try {
      const pdfDoc = await getCachedPdf(fileUrl, this.pdfjsLib);
      this.pdfDoc = pdfDoc;
      console.log('PDF loaded (cached or fresh):', pdfDoc.numPages);
      this.renderPage(1); // فرض بر اینکه تابع سراسری هست
      this.sendToParent({ msg: 'init', data: {} });
    } catch (err) {
      console.error('❌ Failed to load PDF:', err);
    }
  },

  async renderPage(pageNumber) {
    const { widthInPx } = this.getA4SizePixels();

    const page = await this.pdfDoc.getPage(pageNumber);
    const originalViewport = page.getViewport({ scale: 1 });
    const scale = widthInPx / originalViewport.width;
    const viewport = page.getViewport({ scale });

    this.resizeCanvases(viewport.width, viewport.height);

    const ctx = this.pdfCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.pdfCanvas.width, this.pdfCanvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    this.sendToParent({ msg: 'loaded', data: { pages: this.pdfDoc.numPages } });

    this.setupFabricEvents();
  },

  setupFabricEvents() {
    this.fabricCanvas.off(); // Remove previous listeners to avoid duplicates

    this.fabricCanvas.on('object:selected', (event) => {
      const obj = event.target;
      this.sendToParent({
        msg: 'selected',
        data: {
          id: obj.id || null,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
        },
      });
    });

    this.fabricCanvas.on('object:moving', (event) => {
      const obj = event.target;
      this.sendToParent({
        msg: 'moving',
        data: {
          id: obj.id || null,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
        },
      });
    });

    this.fabricCanvas.on('object:modified', (event) => {
      const obj = event.target;
      this.sendToParent({
        msg: 'modified',
        data: {
          id: obj.id || null,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
        },
      });
    });
  },

  addAnnotation() {
    const textbox = new this.fabric.Textbox('Hello, Fabric!', {
      left: 100,
      top: 100,
      fontSize: 30,
      fill: 'blue',
      width: 200,
      textAlign: 'center',
    });
    this.fabricCanvas.add(textbox);
  },

  deleteAnnotation() {
    const active = this.fabricCanvas.getActiveObject();
    if (active) {
      this.fabricCanvas.remove(active);
    }
  },

  async loadPdfFromUrl(url) {
    const loadingTask = this.pdfjsLib.getDocument(url);
    this.pdfDoc = await loadingTask.promise;
    console.log('PDF loaded:', this.pdfDoc.numPages);
    this.renderPage(1);
  },

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      const { msg, data } = event.data;
      this.handleMessage(msg, data);
    });
  },

  handleMessage(msg, data) {
    const handlers = {
      load: () => this.loadPdfFromUrl(data.url),
      addAnnotation: () => this.addAnnotation(),
      deleteAnnotation: () => this.deleteAnnotation(),
      page: () => this.renderPage(data.page || 1),
    };
    if (handlers[msg]) {
      handlers[msg](data);
    } else {
      console.log('Unknown message:', msg);
    }
  },
};
