<template>
  <q-toolbar>
    <q-pagination dir="ltr" v-model="current" :max="pages" input input-class="text-orange-10" />
    <q-space></q-space>
    <div class="q-pa-ls">
      <q-btn-group outline size="small">
        <!-- Add Button -->
        <q-btn outline size="small" icon="add" color="primary" @click="handleAdd" />

        <!-- Delete Button -->
        <q-btn outline size="small" icon="delete" color="primary" @click="handleDelete" />

        <!-- Save Button -->
        <q-btn outline size="small" icon="save" color="primary" @click="handleSave" />
      </q-btn-group>
    </div>
  </q-toolbar>
  <iframe
    ref="pdfFrame"
    src="/pdfjs/index.html"
    width="100%"
    style="height: calc(100lvh - 121px)"
  ></iframe>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  type LoadPdfEvent,
  type FabricModifiedEvent,
  type FabricMovingEvent,
  type FabricSelectEvent,
} from 'src/models/events';
const pdfFrame = ref<HTMLIFrameElement | null>(null);
const pages = ref<number>(0);
const current = ref(1);
onMounted(() => {
  sendPdfToIframe('/public/form100.pdf');
});

const handleAdd = () => {
  pdfFrame.value?.contentWindow?.postMessage({ msg: 'addAnnotation', data: {} }, '*');
};

const handleDelete = () => {
  pdfFrame.value?.contentWindow?.postMessage({ msg: 'deletedAnnotation', data: {} }, '*');
};

const handleSave = () => {};

function sendPdfToIframe(pdfDataUrl: string) {
  pdfFrame.value?.contentWindow?.postMessage(
    {
      type: 'load',
      pdfDataUrl,
    },
    '*',
  );
  goToPage(1);
}

function goToPage(pageNumber: number) {
  pdfFrame.value?.contentWindow?.postMessage(
    {
      type: 'goToPage',
      page: pageNumber,
    },
    '*',
  );
}
type MessageHandlerFunction = (data: object) => void;

const messageHandler = () => {
  const handlers: Record<string, MessageHandlerFunction> = {
    selected: (data) => {
      const event = data as FabricSelectEvent;
      console.log(event);
    },
    moving: (data) => {
      const event = data as FabricMovingEvent;
      console.log(event);
    },
    modified: (data) => {
      const event = data as FabricModifiedEvent;
      console.log(event);
    },
    loaded: (data) => {
      const event = data as LoadPdfEvent;
      pages.value = event.pages;
      console.log(event);
    },
  };

  const unknown: MessageHandlerFunction = () => {
    console.log('Unknown message received');
  };

  const handleMessage = (msg: string, data: object) => {
    const handler = handlers[msg] ?? unknown;
    handler(data);
  };

  return { handleMessage };
};

window.addEventListener('message', (event) => {
  // بررسی امنیت منبع
  if (event.origin !== window.origin) {
    console.error('Received message from an untrusted origin:', window.origin, event.origin);
    return;
  }
  const { msg, data } = event.data;
  const handler = messageHandler();

  handler.handleMessage(msg, data);
});
</script>
<style>
iframe {
  border: solid 1px #ddd;
}
</style>
