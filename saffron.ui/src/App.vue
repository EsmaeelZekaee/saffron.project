<template>
  <router-view />
</template>

<script setup lang="ts">
import { useIframeStore } from 'src/stores/Iframe';
import { onBeforeUnmount, onMounted } from 'vue';
const iframeStore = useIframeStore();

const handleMessage = (event: MessageEvent) => {
  if (event.origin !== window.origin && import.meta.env.PROD) return;

  const { msg, data } = event.data;
  if (msg) {
    // Run async logic without making the event handler async
    void iframeStore.handleMessage(msg, data);
  }
};

onMounted(() => {
  window.addEventListener('message', handleMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
});

</script>
