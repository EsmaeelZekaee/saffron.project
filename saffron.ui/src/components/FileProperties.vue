<template>
  <div class="q-pa-md" v-if="!editMode && selectedFolder && selectedFile?._id">
    <q-card>
      <q-item>
        <q-item-section avatar>
          <q-icon color="red-10" name="fa-solid fa-file-pdf"></q-icon>
        </q-item-section>
        <q-item-section>
          <q-item-label> {{ $t('file.title') }} {{ selectedFile?.title }} </q-item-label>
          <q-item-label caption>
            {{ $t('file.updatedAt') }} <span v-format-date="selectedFile?.uploaded_at"></span>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-card-actions align="right" class="q-gutter-md">
        <q-btn-group>
          <q-btn
            dense
            size="small"
            @click="handelOpen"
            flat
            color="blue-5"
            icon="fa-solid fa-book-open"
          ></q-btn>
          <q-btn
            dense
            size="small"
            @click="handelEdit"
            flat
            color="green-5"
            icon="fa-solid fa-edit"
          ></q-btn>
        </q-btn-group>
      </q-card-actions>
    </q-card>
  </div>
  <div class="q-pa-md" v-if="selectedFolder && (!selectedFile?._id || editMode)">
    <q-form @submit.prevent="submitForm">
      <q-card class="q-pa-md" flat bordered>
        <q-card-section>
          <q-file
            dense
            v-model="pdfFile"
            :label="$t('file.upload.hint')"
            accept=".pdf"
            outlined
            counter
            use-chips
            :rules="[(val) => !!val || $t('file.required')]"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            :disable="loading || !pdfFile"
            :loading="loading"
            dense
            flat
            size="small"
            icon="fa-solid fa-file-import"
            type="submit"
            color="primary"
          />
        </q-card-actions>
      </q-card>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { type IFileModel, useFolderStore } from 'src/stores/folder';
import { useTabStore } from 'src/stores/tab';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

// import { api } from 'src/boot/axios';
const { t } = useI18n();
const editMode = ref(false);
const folderStore = useFolderStore();
const tabStore = useTabStore();

const loading = ref(false);
const { selectedFolder, selectedFile } = storeToRefs(folderStore);

const $q = useQuasar();
const pdfFile = ref<File | null>(null);

onMounted(async () => {
  await folderStore.getSelectedFile();
});

watch(selectedFolder, async () => {
  await folderStore.getSelectedFile();
  editMode.value = false;
  pdfFile.value = null;
});

async function handelOpen() {
  if (folderStore.selectedFile) {
    const exists = tabStore.tabs.some(
      (x) => x?.data !== null && (x.data as IFileModel)._id == folderStore.selectedFile?._id,
    );
    if (exists) return;
    await tabStore.addTab(
      'fa-solid fa-file-pdf',
      folderStore.selectedFile?.title,
      folderStore.selectedFile,
    );

  }
}
// async function handelDownload() {
//   if (!folderStore.selectedFile?._id) return;
//   try {
//     const response = await api.get(
//       `/api/v1/media/files/download/${folderStore.selectedFile?.saved_filename}`,
//       {
//         responseType: 'blob', // this is important!
//       },
//     );

//     const url = window.URL.createObjectURL(new Blob([response.data]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute(
//       'download',
//       selectedFile.value?.original_filename ||
//         selectedFile.value?.saved_filename ||
//         `${selectedFile.value?._id}.pdf`,
//     ); // adjust filename
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url); // cleanup
//   } catch (err) {
//     console.error('Download failed', err);
//   }
// }

function handelEdit() {
  editMode.value = !editMode.value;
  pdfFile.value = null;
}
async function submitForm() {
  loading.value = true;
  if (!pdfFile.value) {
    $q.notify({
      type: 'negative',
      message: t('file.required'),
    });
    return;
  }

  const formData = new FormData();
  formData.append('file', pdfFile.value);
  formData.set('title', pdfFile.value.name);
  await folderStore.createFile(formData);
  loading.value = false;
  if (folderStore.status === 'fail') {
    $q.notify({
      type: 'negative',
      message: t(folderStore.message),
    });
    return;
  }
  await folderStore.getSelectedFile();

  editMode.value = false;
}
</script>
