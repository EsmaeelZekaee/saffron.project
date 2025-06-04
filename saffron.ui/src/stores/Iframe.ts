// src/stores/iframe.ts
import { defineStore } from 'pinia'
import type { FabricEventPayload } from 'src/stores/annotation'
import { toRaw } from 'vue'
export type FabricEventName =
    | 'object:added'
    | 'object:removed'
    | 'object:modified'
    | 'object:moving'
    | 'object:scaling'
    | 'object:rotating'
    | 'selection:created'
    | 'selection:updated'
    | 'selection:cleared'
    | 'text:changed'
    | 'editing:entered'
    | 'editing:exited'
    | 'mouse:down'
    | 'mouse:up'
    | 'mouse:move'
    | 'loaded'
    | 'init'
    | 'properties:toggle'

/**
 * یک delegate می‌تواند async باشد و دادهٔ دریافتی را پردازش کند.
 * بنابراین callbackها می‌توانند Promise<void> برگردانند.
 */
type EventDelegate = (data: object) => Promise<void> | void

export const useIframeStore = defineStore('iframe', {
    state: () => ({
        iframeRef: null as HTMLIFrameElement | null,
        lastEvent: '' as string,
        lastPayload: null as object | null,
        delegates: {} as Record<FabricEventName, Set<EventDelegate>>
    }),

    actions: {
        /**
         * iframeRef را تنظیم می‌کند تا بعداً بتوان postMessage فرستاد.
         */
        setIframeRef(ref: HTMLIFrameElement) {
            this.iframeRef = ref
        },

        /**
         * متدی برای ارسال پیام به داخل iframe.
         * اگر احیاناً بخواهید پیام را به‌صورت غیرهمزمان بفرستید،
         * می‌توانید اینجا عمل غیرهمزمان خاصی قرار دهید.
         */
        postMessage(message: object, origin: string = '*') {
            if (this.iframeRef?.contentWindow) {
                // در صورت نیاز به ارسال‌های غیرهمزمانِ پیشرفته:
                // await someAsyncPreprocess(message)
                this.iframeRef.contentWindow.postMessage(message, origin)
            } else {
                console.warn('Iframe not available')
            }
        },

        /**
         * نمونهٔ یک Action غیرهمگام (async) که ممکن است قبل از sendMessage
         * عملیاتی انجام دهد.
         */
        goToPage(pageNumber: number) {
            // فرض کنید قبل از ارسال پیام، می‌خواهیم یک تأخیر یا 
            // fetch انجام دهیم:
            this.postMessage({
                msg: 'page',
                data: { page: +pageNumber }
            })
        },

        updateAnnotations(data: FabricEventPayload) {
            this.postMessage({
                msg: 'annotation:update',
                data: toRaw(data)
            })
        },

        /**
         * یک action برای درج textbox در iframe.
         */
        addTextBox(id: string, annotation: FabricEventPayload | null = null) {
            // اگر این کار نیاز به منطق غیرهمگام داشت، اینجا می‌شود.
            this.postMessage({ msg: 'annotation:add', data: { id, type: 'textbox', annotation:{...annotation} } }, '*')
        },
        clear() {
            this.postMessage({ msg: 'annotation:clear', data: {} }, '*')
        },
        /**
         * ثبت یک Delegate برای یک رویداد خاص.
         */
        registerDelegate(event: FabricEventName, fn: EventDelegate) {
            if (!this.delegates[event]) {
                this.delegates[event] = new Set()
            }
            this.delegates[event].add(fn)
        },

        /**
         * حذف Delegate از یک رویداد خاص.
         */
        unregisterDelegate(event: FabricEventName, fn: EventDelegate) {
            this.delegates[event]?.delete(fn)
        },

        /**
         * وقتی پیامی از iframe می‌رسد، این متد فراخوانی می‌شود.
         * چون ممکن است delegateها async باشند، خود handleMessage
         * نیز به‌صورت async نوشته شده و زمانی که همه delegateها
         * اجرا شدند به caller بازمی‌گردد.
         */
        async handleMessage(event: FabricEventName, data: object) {
            // ذخیرهٔ آخرین event برای برقراری وضعیت یا دیباگ
            this.lastEvent = event
            this.lastPayload = data

            const handlers = this.delegates[event]
            if (!handlers) {
                // اگر delegateی برای این رویداد ثبت نشده، کافیست مستقیم برگردیم
                return
            }

            // اجرای همزمان همه delegateها و صبر تا اتمامِ همهٔ آن‌ها
            const promises: Promise<void>[] = []
            handlers.forEach((fn) => {
                try {
                    const result = fn(data)
                    if (result instanceof Promise) {
                        promises.push(result)
                    }
                } catch (e) {
                    console.error(`Delegate for ${event} threw an error:`, e)
                }
            })

            if (promises.length > 0) {
                try {
                    await Promise.all(promises)
                } catch (e) {
                    console.error('Error in one of the async delegates:', e)
                }
            }
        }
    }
})
