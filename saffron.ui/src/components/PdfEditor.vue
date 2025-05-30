<template>
  <div v-if="!!file?._id">
    <q-bar>
      <!-- Edit -->
      <q-btn dense flat round icon="add" @click="handleAdd" />
      <q-btn dense flat round icon="delete" @click="handleDelete" />
      <q-separator vertical spaced />
      <!-- Undo / Redo -->
      <q-btn dense flat round icon="undo" />
      <q-btn dense flat round icon="redo" />

      <q-separator vertical spaced />

      <!-- Save -->
      <q-btn dense flat round icon="save" @click="handleSave" />

      <q-separator vertical spaced />

      <!-- Zoom -->
      <q-btn dense flat round icon="zoom_in" />
      <q-btn dense flat round icon="zoom_out" />

      <q-separator vertical spaced />

      <!-- Alignments -->
      <q-btn dense flat round icon="vertical_align_top" />
      <q-btn dense flat round icon="vertical_align_bottom" />
      <q-btn dense flat round icon="format_align_left" />
      <q-btn dense flat round icon="format_align_right" />

      <q-separator vertical spaced />

      <!-- Same width/height -->
      <q-btn dense flat round icon="swap_horiz" />
      <q-btn dense flat round icon="swap_vert" />

      <q-separator vertical spaced />

      <!-- Text / Shape -->
      <q-btn dense flat round icon="title" />
      <q-btn dense flat round icon="category" />

      <q-separator vertical spaced />

      <q-btn dense flat round icon="print" />
    </q-bar>
    <iframe
      ref="pdfFrame"
      :src="src"
      width="100%"
      style="height: calc(100vh - 126px); border: 0; margin: 0; padding: 0"
    ></iframe>
    <q-bar dense class="row justify-center items-center gap-2" dir="ltr">
      <q-btn flat icon="fa-solid fa-backward-step" @click="goToPage((page = 1))" />
      <q-btn flat icon="fa-solid fa-backward" @click="goToPage((page = page > 1 ? page - 1 : 1))" />

      <div class="q-pa-md">
        <div class="cursor-pointer">
          {{ pages }} /{{ page }}
          <q-popup-edit v-model="page" auto-save v-slot="scope">
            <q-input
              v-model="scope.value"
              dense
              autofocus
              counter
              @keyup.enter="handlePageChange(scope)"
            />
          </q-popup-edit>
        </div>
      </div>
      <q-btn
        flat
        icon="fa-solid fa-forward"
        @click="goToPage((page = page < pages ? page + 1 : pages))"
      />
      <q-btn flat icon="fa-solid fa-forward-step" @click="goToPage((page = pages))" />
    </q-bar>
  </div>
  <div v-else style="height: calc(100vh); border: 0; margin: 0; padding: 0">
    <p>برای شروع:</p>
    <ol>
      <li>از سمت چپ، فایل مورد نظر خود را از درخت فایل‌ها انتخاب کنید.</li>
      <li>یا یک فایل جدید PDF را از طریق دکمه‌ی <strong>آپلود</strong> اضافه کنید.</li>
    </ol>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  type LoadPdfEvent,
  type FabricModifiedEvent,
  type FabricMovingEvent,
  type FabricSelectEvent,
} from 'src/models/events';
import { type IFileModel } from 'src/stores/folder';
const props = defineProps<{ file: IFileModel }>();
const pdfFrame = ref<HTMLIFrameElement | null>(null);
const pages = ref<number>(0);
const page = ref<number>(1);

import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';

const authStore = useAuthStore();

const handleAdd = () => {
  pdfFrame.value?.contentWindow?.postMessage({ msg: 'addAnnotation', data: {} }, '*');
};

const handleDelete = () => {
  pdfFrame.value?.contentWindow?.postMessage({ msg: 'deletedAnnotation', data: {} }, '*');
};

const handleSave = () => {};

function handlePageChange(scope: { set: () => void; cancel: () => void }) {
  if (page.value < 1 || page.value > pages.value) {
    scope.cancel();
    return;
  }
  scope.set();
  if (page.value < 1) page.value = 1;
  if (page.value > pages.value) page.value = pages.value;
  goToPage(page.value);
}

const src = computed(() => {
  return `/pdfjs/index.html?file=${api.getUri()}/api/v1/media/files/download/${authStore.user?.username}/${props.file.saved_filename}`;
});

function goToPage(pageNumber: number) {
  pdfFrame.value?.contentWindow?.postMessage(
    {
      msg: 'page',
      data: { page: +pageNumber },
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
    init: () => {},
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
