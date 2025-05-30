import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

export enum AnnotationType {
    Text = 'Text',
}

export interface FileAnnotation {
    id: string
    type: AnnotationType
    data: object
}


function mapToObject(map: Map<string, FileAnnotation[]>): Record<string, FileAnnotation[]> {
    const obj: Record<string, FileAnnotation[]> = {}
    for (const [key, value] of map.entries()) {
        obj[key] = value
    }
    return obj
}


function objectToMap(obj: Record<string, FileAnnotation[]>): Map<string, FileAnnotation[]> {
    return new Map(Object.entries(obj))
}

export const useAnnotationStore = defineStore('annotations', {
    state: () => ({
        annotationsMap: new Map<string, FileAnnotation[]>(),
    }),

    actions: {
        addAnnotation(fileId: string, type: AnnotationType, data: object): string {
            const id = uuidv4()
            const annotations = this.annotationsMap.get(fileId) || []
            annotations.push({ id, type, data })
            this.annotationsMap.set(fileId, annotations)
            return id
        },

        getAnnotations(fileId: string): FileAnnotation[] {
            return this.annotationsMap.get(fileId) || []
        },

        updateAnnotation(fileId: string, id: string, newData: object): boolean {
            const annotations = this.annotationsMap.get(fileId)
            if (!annotations) return false
            const index = annotations.findIndex((a: { id: string }) => a.id === id)
            if (index === -1) return false
            annotations[index].data = newData
            this.annotationsMap.set(fileId, annotations)
            return true
        },

        removeAnnotation(fileId: string, id: string): boolean {
            const annotations = this.annotationsMap.get(fileId)
            if (!annotations) return false
            const filtered = annotations.filter((a: { id: string }) => a.id !== id)
            if (filtered.length === annotations.length) return false
            this.annotationsMap.set(fileId, filtered)
            return true
        },

        removeAnnotationsByFile(fileId: string): void {
            this.annotationsMap.delete(fileId)
        }
    },


    persist: {
        storage: localStorage,
        paths: ['annotationsMap'],
        serialize: (state: { annotationsMap: Map<string, FileAnnotation[]> }) => JSON.stringify({
            annotationsMap: mapToObject(state.annotationsMap),
        }),
        deserialize: (str: string) => {
            const parsed = JSON.parse(str)
            return {
                annotationsMap: objectToMap(parsed.annotationsMap || {})
            }
        }
    } as PersistenceOptions
})
