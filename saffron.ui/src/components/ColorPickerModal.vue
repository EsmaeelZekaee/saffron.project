<template>
  <div style="padding: 10px">
    <q-input filled v-model="tempValue" :label="$t(labelKey)" >
      <template v-slot:append>
        <q-icon name="colorize" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-color v-model="tempValue" @update:model-value="applyColor" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import {  ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string | null | undefined;
  labelKey: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const dialog = ref(false);
const tempValue = ref(props.modelValue);


watch(dialog, (val) => {
  if (val) tempValue.value = props.modelValue;
});

const applyColor = () => {
  emit('update:modelValue', tempValue.value || '');
  dialog.value = false;
};
</script>
