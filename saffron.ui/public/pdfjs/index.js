import { getCachedPdf } from './pdf-cache.js';

export const PDFEditor = {
  pdfDoc: null,
  pdfCanvas: null,
  fabricCanvas: null,
  fabricCanvasElement: null,
  generateMongoObjectId() {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () =>
      Math.floor(Math.random() * 16).toString(16),
    );
    return timestamp + random;
  },

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
    this.registerAllFabricEvents(this.fabricCanvas, this.sendToParent);
  },
  registerAllFabricEvents(canvas, sendToParent) {
    const events = [
      'object:added',
      'object:removed',
      'object:modified',
      'object:moving',
      'object:scaling',
      'object:rotating',
      'selection:created',
      'selection:updated',
      'selection:cleared',
      'text:changed',
      'editing:entered',
      'editing:exited',
      'mouse:down',
      'mouse:up',
      'mouse:move',
    ];

    events.forEach((eventName) => {
      canvas.on(eventName, (e) => {
        const target = e?.target;

        const base = {
          page: this.page,
          id: target?.id ?? null,
          left: target?.left,
          top: target?.top,
          width: target?.width,
          height: target?.height,
          angle: target?.angle,
          scaleX: target?.scaleX,
          scaleY: target?.scaleY,
          text: target?.text,
        };

        const extra = {};

        // Special cases
        if (eventName === 'selection:created' || eventName === 'selection:updated') {
          Object.assign(extra, {
            ids: e?.selected?.map((o) => o.id ?? null) ?? [],
          });
        }

        if (eventName.startsWith('mouse:') && e.pointer) {
          Object.assign(extra, {
            pointer: { x: e.pointer.x, y: e.pointer.y },
          });
        }

        sendToParent({
          msg: eventName,
          data: {
            ...base,
            ...extra,
          },
        });
      });
    });
  },
  addAnnotation() {
    const textbox = new this.fabric.Textbox('Hello, Saffron!', {
      left: 100,
      top: 100,
      fontSize: 14,
      fill: 'blue',
      width: 200,
      textAlign: 'center',
    });
    const id = this.generateMongoObjectId();
    textbox.id = id;
    this.fabricCanvas.add(textbox);
    const obj = this.findById(id);

    if (obj) {
      this.fabricCanvas.setActiveObject(obj);
      this.fabricCanvas.requestRenderAll();
      this.fabricCanvas.fire('object:selected', { target: obj });
    } else {
      console.log('the object not found!');
    }
  },
  findById(id) {
    return this.fabricCanvas.getObjects().find((o) => o.id === id);
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
