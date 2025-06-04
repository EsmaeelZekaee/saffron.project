import { defineStore } from 'pinia'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'
import { roundNested } from 'src/utils/roundNested';
import { ref, watch } from 'vue';
import { useIframeStore } from './Iframe';
import isEqual from 'fast-deep-equal';

export interface FabricEventPayload {
    id?: string;
    type?: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    fill?: string;
    stroke?: string;
    text?: string;
    fontSize?: number;
    textAlign?: string;
    opacity?: number;
    visible?: boolean;
    selectable?: boolean;
    hasControls?: boolean;
    hasBorders?: boolean;
}


export interface PageAnnotations {
    [pageNumber: number]: FabricEventPayload[];
}

export interface FileAnnotationsMap {
    [fileId: string]: PageAnnotations;
}

export const useAnnotationsStore = defineStore('annotations', {
    state: () => {
        const annotations = ref<FileAnnotationsMap>({})
        const selected = ref<FabricEventPayload>()
        const iframeStore = useIframeStore()

        watch(selected, (newValue: FabricEventPayload | undefined, oldValue: FabricEventPayload | undefined) => {
            if (newValue && isEqual(newValue, oldValue))
                iframeStore.updateAnnotations(newValue)
        }, { deep: true })



        return { annotations, selected }
    },
    persist: {
        key: 'saffron-annotations',
        storage: localStorage, // no need for custom map conversion
    } as PersistenceOptions,
    actions: {
        getAnnotations(fileId: string, page: number): FabricEventPayload[] {
            return this.annotations[fileId]?.[page] ?? [];
        },

        addAnnotation(fileId: string, page: number, annotation: FabricEventPayload) {
            if (!this.annotations[fileId]) {
                this.annotations[fileId] = {};
            }
            if (!this.annotations[fileId][page]) {
                this.annotations[fileId][page] = [];
            }
            this.annotations[fileId][page].push(annotation);
            this.selected = annotation;
        },

        updateAnnotation(fileId: string, page: number, updated: FabricEventPayload) {
            const pageAnnotations = this.annotations[fileId]?.[page];
            if (!pageAnnotations) return;

            const index = pageAnnotations.findIndex((a: { id: string; }) => a.id === updated.id);
            if (index !== -1) {
                this.annotations[fileId][page][index] = updated;
                this.selected = updated;
            }
        },
        upsertAnnotation(fileId: string, page: number, annotation: FabricEventPayload) {
            annotation = roundNested(annotation)
            if (!this.annotations[fileId]) {
                this.annotations[fileId] = {};
            }
            if (!this.annotations[fileId][page]) {
                this.annotations[fileId][page] = [];
            }

            const index = this.annotations[fileId][page].findIndex((a: { id: string; }) => a.id === annotation.id);
            if (index !== -1) {
                // Update
                annotation = {...this.annotations[fileId][page][index], ...annotation}
                this.annotations[fileId][page][index] = annotation;
            } else {
                // Insert
                this.annotations[fileId][page].push(annotation);
            }
            this.selected = annotation;
        },
        deleteAnnotation(fileId: string, page: number, id: string) {
            const pageAnnotations = this.annotations[fileId]?.[page];
            if (!pageAnnotations) return;

            this.annotations[fileId][page] = pageAnnotations.filter((a: { id: string; }) => a.id !== id);
            this.selected = null;
        },
    },
});
