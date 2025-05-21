<template>
  <q-splitter dir="ltr" v-model="splitterModel">
    <template v-slot:before>
      <div>
        <FolderExplorer></FolderExplorer>
      </div>
    </template>

    <template v-slot:after> </template>
  </q-splitter>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import FolderExplorer from 'components/FolderExplorer.vue';
const splitterModel = ref(30);
</script>
