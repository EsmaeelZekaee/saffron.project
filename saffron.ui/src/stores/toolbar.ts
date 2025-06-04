// src/stores/toolbar.ts
import { defineStore } from 'pinia'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

export const useToolbarStore = defineStore('Toolbar', {
  state: () => ({
    showProperties: Boolean()    
  }),

  actions: {
    toggleProperties(){
        this.showProperties = !this.showProperties;
    }
  },

  persist: {
    key: 'saffron-toolbar',
    storage: localStorage,
  } as PersistenceOptions,
})
