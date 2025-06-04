// src/stores/page.ts
import { defineStore } from 'pinia'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

interface PageState {
  pages: Record<string, number>, // fileId -> pageNumber
  totalPages: Record<string, number> // fileId -> pageNumber
}

export const usePageStore = defineStore('page', {
  state: (): PageState => ({
    pages: {},
    totalPages:{}
  }),

  actions: {
    getPage(fileId: string): number {
      return this.pages[fileId] ?? 1
    },

    setPage(fileId: string, page: number) {
      this.pages[fileId] = page
    },

    setTotalPages(fileId: string, pages: number): number {
      return this.totalPages[fileId] = pages
    },

    getTotalPage(fileId: string) {
      return this.totalPages[fileId] ?? 1
    },
  },

  persist: {
    key: 'saffron-pages',
    storage: localStorage,
  } as PersistenceOptions,
})
