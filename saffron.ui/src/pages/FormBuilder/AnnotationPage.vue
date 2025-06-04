<template>
  <q-splitter
    v-model="leftSize"
    :limits="[10, 50]"
    dir="ltr"
    @update:model-value="handleSplitterResize('leftSize', $event)"
  >
    <template v-slot:before>
      <div class="bg-grey-2" dir="rtl">
        <q-splitter
          v-model="treeSize"
          horizontal
          style="height: 100vh;"
          @update:model-value="handleSplitterResize('treeSize', $event)"
        >
            <template v-slot:before>
              <FolderExplorer />
            </template>
            <template v-slot:after>
              <FileProperties></FileProperties>
            </template>
          
        </q-splitter>
      </div>
    </template>

    <template v-slot:after>
      <q-splitter
        v-model="rightSize"
        :limits="[10, 80]"
        @update:model-value="handleSplitterResize('rightSize', $event)"
      >
        <template v-slot:before>
          <div class="bg-white" dir="rtl" style="overflow-y: hidden">
            <MainEditor />
          </div>
        </template>

        <template v-slot:after>
          <div class="bg-grey-1" dir="rtl">
            <PropertiesPanel />
          </div>
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FolderExplorer from 'components/FolderExplorer.vue';
import MainEditor from 'components/MainEditor.vue';
import PropertiesPanel from 'components/PropertiesPanel.vue';
import FileProperties from 'src/components/FileProperties.vue';

const leftSize = ref(20);
const rightSize = ref(70);
const treeSize = ref(50);
onMounted(() => {
  function loadSize(name: string, init: number = 30) {
    const saved = localStorage.getItem(`splitter-size["${name}"]`);
    return Number(saved ? saved : init);
  }
  leftSize.value = loadSize('leftSize', 20);
  rightSize.value = loadSize('rightSize', 70);
  treeSize.value = loadSize('treeSize', 50);
});
function handleSplitterResize(name: string, newSize: number) {
  localStorage.setItem(`splitter-size["${name}"]`, newSize.toString());
}
</script>
