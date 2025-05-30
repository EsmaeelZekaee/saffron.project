<template>
  <div class="" style="width: 100٪">
    <q-list bordered>
      <q-expansion-item
        group="somegroup"
        icon="fa-solid fa-highlighter"
        :label="$t('public.annotations')"
        default-opened
        header-class="text-primary"
      >
        <q-card>
          <q-card-section>
            <p v-if="folderStore.selectedFile?._id">
              <ul >
                <li :key="annotation.id" v-for="annotation  in annotations">{{ 
                    annotation.data.text}}</li>
              </ul>
            </p>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <q-separator />

      <q-expansion-item
        group="somegroup"
        icon="perm_identity"
        label="Second"
        header-class="text-teal"
      >
        <q-card>
          <q-card-section>
            <FabricPropertiesEditor :model-value="active"></FabricPropertiesEditor>
          </q-card-section>
        </q-card>
      </q-expansion-item>

    </q-list>
  </div>
</template>
<script setup lang="ts">
import { type Annotation, useAnnotationsStore } from 'src/stores/annotation';
import { useFolderStore } from 'src/stores/folder';
import { usePageStore } from 'src/stores/page';
import { computed } from 'vue';
import FabricPropertiesEditor from 'src/components/FabricPropertiesEditor.vue'
import { storeToRefs } from 'pinia';


const pageStore = usePageStore();
const annotationsStore = useAnnotationsStore();
const folderStore = useFolderStore();
const {active} = storeToRefs(annotationsStore)
const annotations = computed<Annotation[]>(() => {
  if (!folderStore.selectedFile?._id) return [];
  return annotationsStore.getAnnotations(
    folderStore.selectedFile?._id,
    pageStore.getPage(folderStore.selectedFile?._id),
  );
});
</script>
