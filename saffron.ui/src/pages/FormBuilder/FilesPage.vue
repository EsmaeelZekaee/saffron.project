<template>
  <q-splitter dir="ltr" v-model="splitterModel">
    <template v-slot:before>
      <div>
        <q-toolbar class="bg-black text-white" dir="rtl">
          <q-btn flat round dense icon="folder"> </q-btn>
          <q-toolbar-title> {{ $t('forms.toolbar.title') }} </q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="create_new_folder"
            @click="handleNewFolder"
            class="q-mr-xs"
          />
          <q-btn flat round dense icon="picture_as_pdf" />
        </q-toolbar>
        <q-tree
          :nodes="treeData"
          node-key="id"
          label-key="label"
          default-expand-all
          dir="rtl"
          :tick-strategy="'none'"
          no-connectors
        >
          <template v-slot:default-header="props">
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon :name="props.node.icon" />
              </q-item-section>
              <q-item-section>
                {{ props.node.label }}
              </q-item-section>
            </q-item>
          </template>
        </q-tree>
      </div>
    </template>

    <template v-slot:after> </template>
  </q-splitter>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { ref } from 'vue';
const $q = useQuasar();

const splitterModel = ref(30);

const handleNewFolder = () => {
  $q.dialog({
    title: 'نام شما؟',
    message: 'لطفاً نام را وارد کنید:',
    prompt: {
      model: '',
      type: 'text',
    
    },
    cancel:'لغو',
    persistent: true,
    ok:'تایید',

  }).onOk((name) => {
    (async () => {
      try {
        await api.post('/media/folders', { name });
        $q.notify({
          type: 'positive',
          message: 'نام با موفقیت ذخیره شد!',
        });
      } catch {
        $q.notify({
          type: 'negative',
          message: 'خطا در ذخیره نام',
        });
      }
    })().catch(() => {});
  });
};

const treeData = [
  {
    id: 'my-forms',
    label: 'My Forms',
    icon: 'folder',
    to: '/fb',
    children: [
      {
        id: 'form-1',
        label: 'Form A',
        icon: 'summarize',
        to: '/fb/form-a',
      },
      {
        id: 'form-2',
        label: 'Form B',
        icon: 'summarize',
        to: '/fb/form-b',
      },
    ],
  },
];
</script>
