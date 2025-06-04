import { getCachedPdf } from './pdf-cache.js';

export const PDFEditor = {
  pdfDoc: null,
  pdfCanvas: null,
  fabricCanvas: null,
  fabricCanvasElement: null,
  lastCall: 0,
  throttleDelay: 50,

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

    this.sendToParent({
      msg: 'loaded',
      data: { currentPage: pageNumber, totalPages: this.pdfDoc.numPages },
    });

    this.setupFabricEvents();
  },
  // 1. تابع برای کشیدن چرخ‌دنده با استفاده از Canvas API
  renderGearIcon(ctx, left, top, styleOverride, fabricObject) {
    const size = 8;
    ctx.save();
    ctx.translate(left, top);
    ctx.beginPath();
    ctx.fillStyle = '#26A69A';
    // چرخ‌دنده ساده (دایره با دندانه)
    for (let i = 0; i < 8; i++) {
      ctx.rotate((Math.PI * 2) / 8);
      ctx.fillRect(size, -2, 2, 3); // دندانه
    }

    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.translate(left, top);
    ctx.ellipse(size + 2, size + 2, 2, 2, 0, 0, 0);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.restore();
  },

  createGearControl() {
    const self = this;
    // 2. تعریف کنترل جدید با رویداد کلیک
    return new this.fabric.Control({
      x: 0.5,
      y: -0.5,
      offsetY: -20,
      offsetX: 0,
      cursorStyle: 'pointer',
      mouseUpHandler: function (eventData, transform) {
        self.sendToParent({ msg: 'properties:toggle' });
        return true;
      },
      render: this.renderGearIcon,
      cornerSize: 24,
    });
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
      //'mouse:move',
    ];

    events.forEach((eventName) => {
      canvas.on(eventName, (e) => {
        const target = e?.target;
        const base = {
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
          const selectedObjects = e.selected?.map((obj) => ({
            id: obj.id,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            type: obj.type,
            text: obj?.text || undefined,
            fill: obj.fill,
            strokeWidth: obj.strokeWidth,
            opacity: obj.opacity,
            fontSize: obj.fontSize,
            fontFamily: obj.fontFamily,
            textAlign: obj.textAlign,
            underline: obj.underline,
            overline: obj.overline,
            backgroundColor: obj.backgroundColor,
            textBackgroundColor: obj.textBackgroundColor,
            charSpacing: obj.charSpacing,
            lineHeight: obj.lineHeight,
          }));
          Object.assign(extra, {
            selectedObjects: selectedObjects,
            ids: e?.selected?.map((o) => o.id ?? null) ?? [],
          });
        }
        if (eventName === 'object:added' || eventName === 'object:modified') {
          const obj = e.target;
          if (obj) {
            if (obj.fill) {
              obj.set('fill', this.normalizeColorToHex(obj.fill));
            }
            if (obj.stroke) {
              obj.set('stroke', this.normalizeColorToHex(obj.stroke));
            }

            canvas.renderAll(); // برای اعمال تغییرات
          }
        }
        if (eventName.startsWith('mouse:') && e.pointer) {
          const canvasOffset = this.fabricCanvas.upperCanvasEl.getBoundingClientRect();

          Object.assign(extra, {
            pointer: { x: e.pointer.x, y: e.pointer.y },
            offset: { left: canvasOffset.left, top: canvasOffset.top },
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
  normalizeColorToHex(color) {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return color;
    ctx.fillStyle = color; // Fabric accepts "blue" or "rgb(...)"
    return ctx.fillStyle; // Always returns hex like "#0000ff"
  },
  addAnnotation(data) {
    const { id, type, annotation } = data;
    const textbox = new this.fabric.Textbox('Hello, Saffron!', {   });
    textbox.id = id;
    for(const key in annotation){
      console.log(key)
      textbox.set(key,annotation[key])  
    }
    textbox.controls['gear'] = this.createGearControl();
    this.fabricCanvas.add(textbox);

    const obj = this.findById(id);

    if (obj) {
      this.fabricCanvas.setActiveObject(obj);
      this.fabricCanvas.requestRenderAll();
      this.fabricCanvas.fire('object:selected', { target: obj });
    } else {
      // DO NOTHING
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
  updateAnnotation(data) {
    if (!data?.id) return;
    const el = this.fabricCanvas.getObjects().find((o) => (o.id = data.id));
    el.set({
      left: parseFloat(data.left),
      top: parseFloat(data.top),
      width: parseFloat(data.width),
      height: parseFloat(data.height),
      scaleX: parseFloat(data.scaleX),
      scaleY: parseFloat(data.scaleY),
      angle: parseFloat(data.angle),
      // visible: data.visible,
      // selectable: data.selectable,
      // hasBorders: data.hasBorders,
      borderColor: data.borderColor,
      stroke: data.stroke,
      fill: data.fill,
      text: data.text,
      strokeWidth: data.strokeWidth,
      opacity: data.opacity,
      fontSize: data.fontSize,
      fontFamily: data.fontFamily,
      textAlign: data.textAlign,
      underline: data.underline,
      overline: data.overline,
      backgroundColor: data.backgroundColor,
      textBackgroundColor: data.textBackgroundColor,
      charSpacing: data.charSpacing,
      lineHeight: data.lineHeight,
    });

    this.fabricCanvas.requestRenderAll();
  },
  clearAnnotations() {
    this.fabricCanvas.clear();
  },
  async loadPdfFromUrl(url) {
    const loadingTask = this.pdfjsLib.getDocument(url);
    this.pdfDoc = await loadingTask.promise;
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
      'annotation:add': () => this.addAnnotation(data),
      'annotation:delete': () => this.deleteAnnotation(),
      'annotation:clear': () => this.clearAnnotations(),
      'annotation:update': () => this.updateAnnotation(data),
      load: () => this.loadPdfFromUrl(data.url),
      page: () => this.renderPage(data.page || 1),
    };
    if (handlers[msg]) {
      handlers[msg](data);
    } else {
      console.log('Unknown message:', msg);
    }
  },
};
