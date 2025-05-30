<template>
  <div style="height: calc(100vh); box-sizing: border-box">
    <q-bar class="bg-black text-white">
      <q-btn
        flat
        :label="$t('public.dashboard')"
        @click="
          tabStore.setActive({
            name: 'dashboard',
            icon: 'fa-solid fa-dashboard',
            index: -1,
            data: null,
          })
        "
      />
      <q-space />
      <q-tabs
        dir="ltr"
        dense
        inline-label
        shrink
        stretch
        class="bg-black text-white justify-evenly"
        :model-value="tabStore.activeTab?.index"
        @update:model-value="onTabChanged"
      >
        <q-tab
          :class="tab.index === tabStore.activeTab?.index ? 'bg-blue' : ''"
          v-for="tab in tabStore.tabs"
          :key="tab.index"
          :name="tab.index"
        >
          <div class="row items-center no-wrap no-uppercase">
            <span style="text-transform: none">{{ tab.name }}</span>
            <q-icon :name="tab.icon" size="16px" class="q-mr-sm" />
            <q-btn
              dense
              flat
              round
              icon="close"
              size="xs"
              class="q-ml-sm"
              @click.stop="removeTab(tab.index)"
            />
          </div>
        </q-tab>
      </q-tabs>
    </q-bar>
    <q-tab-panels
      v-if="tabStore.activeTab"
      v-model="tabStore.activeTab.name"
      animated
      class="shadow-2 rounded-borders"
      style="padding: 0; margin: 0"
    >
      <q-tab-panel name="dashboard" style="height: calc(100vh - 64px)">
        <DashboardContent />
      </q-tab-panel>
      <q-tab-panel
        v-for="tab in tabStore.tabs"
        :key="tab.index"
        :name="tab.name"
        style="padding: 0; margin: 0; overflow: hidden"
      >
        <PdfEditor v-if="file" :file="file"></PdfEditor>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { type TabDefinition, useTabStore } from 'src/stores/tab';
import { ref, watch, onMounted } from 'vue';
import PdfEditor from './PdfEditor.vue';

import DashboardContent from './DashboardContent.vue';
import { type IFileModel } from 'src/stores/folder';

const tabStore = useTabStore();
const file = ref<IFileModel | null>(null);

function onTabChanged(index: number) {
  const tab = tabStore.findByIndex(index);
  if (tab) {
    tabStore.setActive(tab);
  }
}

watch(
  () => tabStore.activeTab,
  (value: TabDefinition | null) => {
    if (!value) return;
    file.value = value.data as IFileModel;
  },
);

function removeTab(index: number) {
  const isActive = tabStore.activeTab?.index === index;

  tabStore.killTab(index);

  if (isActive) {
    const nextTab =
      tabStore.tabs.find((t) => t.index > index) ||
      tabStore.tabs
        .slice()
        .reverse()
        .find((t) => t.index < index);
    tabStore.setActive(nextTab ?? null);
  }
}
onMounted(() => {});
</script>
