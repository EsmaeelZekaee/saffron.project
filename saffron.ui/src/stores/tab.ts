// src/stores/auth.ts
import { defineStore } from 'pinia'
import { nextTick } from 'vue';

export interface TabDefinition {
    icon: string,
    name: string,
    index: number,
    data: object | null
}

export const useTabStore = defineStore('tab', {
    state: () => ({
        tabs: <TabDefinition[]>[],
        activeTab: null as TabDefinition | null
    }),
    getters: {
        activeTabIndex: (state) => state.activeTab?.index || -1
    },
    actions: {
        async addTab(icon: string, name: string, data = null as object | null) {
            this.tabs.push( {
                icon,
                name,
                index: this.tabs.length + 1,
                data,
            });
            await nextTick(() => {
                this.setActive(this.findByIndex(this.tabs.length));
            });

        },
        killTab(index: number) {
            this.tabs = this.tabs.filter(x => x.index !== index)
        },
        setActive(tab: TabDefinition | null) {
            this.activeTab = tab
        },
        findByIndex(index: number): TabDefinition | null {
            return this.tabs.find((t) => t.index === index) as TabDefinition;
        }
    }
})
