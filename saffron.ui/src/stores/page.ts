// src/stores/page.ts
import { defineStore } from 'pinia'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

interface PageState {
  pages: Record<string, number> // fileId -> pageNumber
}

export const usePageStore = defineStore('page', {
  state: (): PageState => ({
    pages: {},
  }),

  actions: {
    getPage(fileId: string): number {
      return this.pages[fileId] ?? 1
    },

    setPage(fileId: string, page: number) {
      this.pages[fileId] = page
    },
  },

  persist: {
    key: 'saffron-pages',
    storage: localStorage,
  } as PersistenceOptions,
})
