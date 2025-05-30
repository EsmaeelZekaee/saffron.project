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
      <q-btn dense flat icon="fa-solid fa-backward-step" @click="goToPage((page = 1))" />
      <q-btn
        dense
        flat
        icon="fa-solid fa-angle-left"
        @click="goToPage((page = page > 1 ? page - 1 : 1))"
      />

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
        dense
        icon="fa-solid fa-angle-right"
        @click="goToPage((page = page < pages ? page + 1 : pages))"
      />
      <q-btn dense flat icon="fa-solid fa-forward-step" @click="goToPage((page = pages))" />
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
import { type LoadPdfEvent } from 'src/models/events';
import { type IFileModel } from 'src/stores/folder';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';
import { AnnotationType, useAnnotationsStore } from 'src/stores/annotation';
import { usePageStore } from 'src/stores/page';
import { useFolderStore } from 'src/stores/folder';

const annotationsStore = useAnnotationsStore();

const props = defineProps<{ file: IFileModel }>();
const pdfFrame = ref<HTMLIFrameElement | null>(null);
const pages = ref<number>(0);
const pageStore = usePageStore();
const folderStore = useFolderStore();

const page = computed<number>({
  get: () => {
    const fileId = folderStore.selectedFile?._id;
    if (!fileId) return -1;
    return pageStore.getPage(fileId);
  },
  set: (value: number) => {
    const fileId = folderStore.selectedFile?._id;
    if (!fileId) return;
    pageStore.setPage(fileId, value);
  },
});

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
  const handlers: Record<string, MessageHandlerFunction> = {};

  const eventNames = [
    'selected',
    'modified',
    'moving',
    'scaling',
    'rotating',
    'added',
    'removed',
    'mousedown',
    'mouseup',
    'mousewheel',
    'mouse:move',
    'mouse:over',
    'mouse:out',
    'drop',
    'dragover',
    'dblclick',
    'loaded',
    'init',
  ];

  for (const name of eventNames) {
    handlers[name] = (data) => {
      if (!props.file?._id) return;

      // Special case for 'loaded' event if needed
      if (name === 'loaded') {
        const event = data as LoadPdfEvent;
        pages.value = event.pages;
        return;
      }
      const obj = data as { id: string; };
      if (obj.id) {
        console.log(obj);
        annotationsStore.upsertAnnotation(props.file._id, page.value, {
          type: AnnotationType.Text,
          id: obj.id,
          data: { ...data },
        });
      }
    };
  }

  return handlers;
};

const handlers = messageHandler();

window.addEventListener('message', (event) => {
  // بررسی امنیت منبع
  if (event.origin !== window.origin) {
    return;
  }

  const { msg, data } = event.data;

  const handler = handlers[msg];
  if (typeof handler === 'function') {
    handler(data);
  } else {
    // TODO
  }
});
</script>
<style>
iframe {
  border: solid 1px #ddd;
}
</style>
