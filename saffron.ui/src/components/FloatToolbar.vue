<!-- FloatToolbar.vue -->
<template>
  <teleport to="body">
    <div
      v-if="visible"
      :style="{
        position: 'fixed',
        top: `${modalPosition.y}px`,
        left: `${modalPosition.x}px`,
        zIndex: 10,
      }"
      class="bg-white shadow-2 rounded-borders row items-center"
    >
      <div v-if="showProperties">
        <q-card flat>
          <q-bar dense>
            <slot name="header"></slot>
            <q-space></q-space>
            <q-btn flat dense icon="fa-solid fa-moving" color="red" ></q-btn>
            <q-btn flat dense icon="minimize" @click="toolbarStore.toggleProperties()" color="red" ></q-btn>
          </q-bar>
          <slot name="content"></slot>
        </q-card>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useToolbarStore } from 'src/stores/toolbar';
import { useIframeStore } from 'src/stores/Iframe';
import { onBeforeUnmount, onMounted } from 'vue';
const toolbarStore = useToolbarStore()
const {showProperties} = storeToRefs(toolbarStore)
const iframeStore = useIframeStore()

defineProps<{
  visible: boolean;
  modalPosition: { x: number; y: number };
  gearPosition: { x: number; y: number };
}>();

onMounted(()=>{
  iframeStore.registerDelegate('properties:toggle', ()=>{toolbarStore.toggleProperties()})
})

onBeforeUnmount(()=>{
  iframeStore.unregisterDelegate('properties:toggle', ()=>{toolbarStore.toggleProperties()})
})
</script>

