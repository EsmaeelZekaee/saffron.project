import { defineStore } from 'pinia'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

export enum AnnotationType {
    Text = 'Text',
    Shape = 'Shape',
    Rectangle = 'Rectangle'
}
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
export interface Annotation {
    id: string;
    type: AnnotationType;
    data: FabricEventPayload;
}

export interface PageAnnotations {
    [pageNumber: number]: Annotation[];
}

export interface FileAnnotationsMap {
    [fileId: string]: PageAnnotations;
}

export const useAnnotationsStore = defineStore('annotations', {
    state: () => ({
        annotations: {} as FileAnnotationsMap,
        selected: {} as Annotation
    }),
    persist: {
        key: 'saffron-annotations',
        storage: localStorage, // no need for custom map conversion
    } as PersistenceOptions,
    getters:{
        active:(state)=>{
            return state.selected
        }
    },
    actions: {
        getAnnotations(fileId: string, page: number): Annotation[] {
            return this.annotations[fileId]?.[page] ?? [];
        },

        addAnnotation(fileId: string, page: number, annotation: Annotation) {
            if (!this.annotations[fileId]) {
                this.annotations[fileId] = {};
            }
            if (!this.annotations[fileId][page]) {
                this.annotations[fileId][page] = [];
            }
            this.annotations[fileId][page].push(annotation);
            this.selected = annotation;
        },

        updateAnnotation(fileId: string, page: number, updated: Annotation) {
            const pageAnnotations = this.annotations[fileId]?.[page];
            if (!pageAnnotations) return;

            const index = pageAnnotations.findIndex((a: { id: string; }) => a.id === updated.id);
            if (index !== -1) {
                this.annotations[fileId][page][index] = updated;
                this.selected = updated;
            }
        },
        upsertAnnotation(fileId: string, page: number, annotation: Annotation) {
            if (!this.annotations[fileId]) {
                this.annotations[fileId] = {};
            }
            if (!this.annotations[fileId][page]) {
                this.annotations[fileId][page] = [];
            }

            const index = this.annotations[fileId][page].findIndex((a: { id: string; }) => a.id === annotation.id);
            if (index !== -1) {
                // Update
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
