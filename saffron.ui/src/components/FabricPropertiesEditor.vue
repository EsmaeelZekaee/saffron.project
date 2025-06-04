<template>
  <FloatToolbar :visible="visible" :modal-position="modalPosition" :gear-position="gearPosition">
    <template #header>
      <q-tabs dense v-model="propertiesTab">
        <q-tab class="height-24" dense name="general">{{
          $t('fabricPropertiesEditor.general')
        }}</q-tab>
        <q-tab class="height-24" dense name="position">{{
          $t('fabricPropertiesEditor.position')
        }}</q-tab>
        <q-tab class="height-24" dense name="size">{{ $t('fabricPropertiesEditor.size') }}</q-tab>
        <q-tab class="height-24" dense name="color">{{ $t('fabricPropertiesEditor.color') }}</q-tab>
      </q-tabs>
    </template>
    <template #content>
      <div class="scroll">
        <q-separator></q-separator>
        <q-card>
          <q-card-section style="min-height: 280px; min-width: 400px">
            <q-tab-panels v-model="propertiesTab">
              <q-tab-panel name="position">
                <q-input
                  dense
                  v-model="selected.left"
                  :label="$t('fabricEditor.left')"
                  type="number"
                />
                <q-input
                  dense
                  v-model="selected.top"
                  :label="$t('fabricEditor.top')"
                  type="number"
                />
              </q-tab-panel>
              <q-tab-panel name="size">
                <q-input
                  dense
                  v-model="selected.width"
                  :label="$t('fabricEditor.width')"
                  type="number"
                />
                <q-input
                  dense
                  v-model="selected.height"
                  :label="$t('fabricEditor.height')"
                  type="number"
                />
                <q-input
                  dense
                  v-model="selected.scaleX"
                  :label="$t('fabricEditor.scaleX')"
                  type="number"
                  step="0.1"
                />
                <q-input
                  dense
                  v-model="selected.scaleY"
                  :label="$t('fabricEditor.scaleY')"
                  type="number"
                  step="0.1"
                />
                <q-field :label="$t('fabricEditor.angle')" stack-label borderless>
                  <template v-slot:control>
                    <q-slider
                      :label="true"
                      :min="0"
                      :max="360"
                      :step="10"
                      :label-value="selected.angle"
                      switch-label-side
                      switch-marker-labels-side
                      dense
                      v-model="selected.angle"
                      class="full-width"
                    >
                  </q-slider>
                  </template>
                </q-field>
                
              </q-tab-panel>
              <q-tab-panel name="color">
                <ColorPickerModal v-model="selected.fill" labelKey="fabricEditor.fill" />
                <ColorPickerModal v-model="selected.stroke" labelKey="fabricEditor.stroke" />
              </q-tab-panel>
              <q-tab-panel name="general">
                <q-input
                  dense
                  v-if="selected.text !== undefined"
                  v-model="selected.text"
                  :label="$t('fabricEditor.text')"
                  type="text"
                />
                <br />
                <label for="slider-fontSize">
                  {{ $t('fabricEditor.fontSize') }}
                </label>

                <q-field :label="$t('fabricEditor.fontSize')" stack-label borderless>
                  <template v-slot:control>
                    <q-slider
                      :label="true"
                      :min="8"
                      :max="72"
                      :step="1"
                      :label-value="selected.fontSize"
                      switch-label-side
                      switch-marker-labels-side
                      dense
                      v-model="selected.fontSize"
                      class="full-width"
                    >
                  </q-slider>
                  </template>
                </q-field>

               
                <q-select
                  dense
                  v-if="selected.textAlign"
                  v-model="selected.textAlign"
                  @update:model-value="selected.textAlign = $event.value"
                  :label="$t('fabricEditor.textAlign')"
                  :options="[
                    { label: $t('fabricEditor.alignLeft'), value: 'left' },
                    { label: $t('fabricEditor.alignCenter'), value: 'center' },
                    { label: $t('fabricEditor.alignRight'), value: 'right' },
                    { label: $t('fabricEditor.alignJustify'), value: 'justify' },
                  ]"
                />
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>
        </q-card>
      </div>
    </template>
  </FloatToolbar>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { type FabricEventPayload } from 'src/stores/annotation';
import { useAnnotationsStore } from 'src/stores/annotation';
import ColorPickerModal from './ColorPickerModal.vue';
import FloatToolbar from './FloatToolbar.vue';
import { useIframeStore } from 'src/stores/Iframe';
import { useFolderStore } from 'src/stores/folder';
import { usePageStore } from 'src/stores/page';
import { storeToRefs } from 'pinia';
import { delay } from 'src/utils/delay';
const propertiesTab = ref('general');
const annotationsStore = useAnnotationsStore();

const modalPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const gearPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const visible = ref<boolean>(false);
const folderStore = useFolderStore();
const pageStore = usePageStore();

const iframeStore = useIframeStore();

const { selected } = storeToRefs(annotationsStore);

async function handelSelect(data: FabricEventPayload) {
  await delay(0);
  const multipleData = data as { selectedObjects: FabricEventPayload[] };
  if (multipleData.selectedObjects) {
    data = multipleData.selectedObjects[0] as FabricEventPayload;
  }
  const rect = iframeStore.iframeRef?.getBoundingClientRect();
  if (!data.left || !rect) return;

  if (data.left && data.top) {
    let left = data.left + rect.left + 10 - (400 - (data.width || 0) * (data.scaleX || 0));
    if (left < rect.left) {
      left = data.left + rect.left + 10;
    }
    modalPosition.value = {
      x: left,
      y: data.top + 24 + (data.height || 0) * (data.scaleY || 0) + rect.top,
    };
    gearPosition.value = {
      x: data.left + (data.width || 0) * (data.scaleX || 0) + rect.left - 15,
      y: data.top + (data.height || 0) * (data.scaleY || 0) + rect.top,
    };
    visible.value = true;
  }

  const fileId = folderStore.selectedFile?._id || '';
  annotationsStore.upsertAnnotation(fileId, pageStore.getPage(fileId), data);
}

function handelMoving() {
  visible.value = false;
}

onMounted(() => {
  iframeStore.registerDelegate('selection:created', handelSelect);
  iframeStore.registerDelegate('object:modified', handelSelect);
  iframeStore.registerDelegate('object:moving', handelMoving);
  iframeStore.registerDelegate('selection:cleared', handelMoving);
});

onBeforeUnmount(() => {
  iframeStore.unregisterDelegate('selection:created', handelSelect);
  iframeStore.unregisterDelegate('object:modified', handelSelect);
  iframeStore.unregisterDelegate('object:moving', handelMoving);
  iframeStore.unregisterDelegate('selection:cleared', handelMoving);
});
</script>
<style>
/* برای WebKit مرورگرها مانند Chrome و Edge */
::-webkit-scrollbar {
  width: 6px; /* عرض اسکرول‌بار */
  height: 6px; /* برای اسکرول افقی */
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #000; /* رنگ مشکی */
  border-radius: 3px;
}

/* برای Firefox */
* {
  scrollbar-width: none;
  scrollbar-color: #000 transparent;
}
</style>
<style scoped>
.height-24 {
  min-height: 16px !important;
  height: 24px !important;
}
</style>
