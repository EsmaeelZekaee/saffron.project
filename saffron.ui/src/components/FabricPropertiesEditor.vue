<template>
  <q-form @submit.prevent="emitUpdated" >
    <q-card flat>
      <q-card-section style="overflow-y: scroll;max-height: 400px; scrollbar-width: 1px; " >
        <q-input dense v-model="form.left" :label="t('fabricEditor.left')" type="number" />
        <q-input dense v-model="form.top" :label="t('fabricEditor.top')" type="number" />
        <q-input dense v-model="form.width" :label="t('fabricEditor.width')" type="number" />
        <q-input dense v-model="form.height" :label="t('fabricEditor.height')" type="number" />
        <q-input dense v-model="form.scaleX" :label="t('fabricEditor.scaleX')" type="number" step="0.1" />
        <q-input dense v-model="form.scaleY" :label="t('fabricEditor.scaleY')" type="number" step="0.1" />
        <q-input dense v-model="form.angle" :label="t('fabricEditor.angle')" type="number" />
        <q-color dense v-model="form.fill" :label="t('fabricEditor.fill')" />
        <q-color dense v-model="form.stroke" :label="t('fabricEditor.stroke')" />

        <q-input dense v-if="form.text !== undefined" v-model="form.text" :label="t('fabricEditor.text')" type="text" />
        <q-input dense v-if="form.fontSize !== undefined" v-model="form.fontSize" :label="t('fabricEditor.fontSize')" type="number" />

        <q-select
          dense
          v-if="form.textAlign !== undefined"
          v-model="form.textAlign"
          :label="t('fabricEditor.textAlign')"
          :options="[
            { label: t('fabricEditor.alignLeft'), value: 'left' },
            { label: t('fabricEditor.alignCenter'), value: 'center' },
            { label: t('fabricEditor.alignRight'), value: 'right' },
            { label: t('fabricEditor.alignJustify'), value: 'justify' },
          ]"
        />

        <q-toggle dense v-model="form.visible" :label="t('fabricEditor.visible')" />
        <q-toggle dense v-model="form.selectable" :label="t('fabricEditor.selectable')" />
        <q-toggle dense v-model="form.hasControls" :label="t('fabricEditor.hasControls')" />
        <q-toggle dense v-model="form.hasBorders" :label="t('fabricEditor.hasBorders')" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn dense :label="t('fabricEditor.apply')" type="submit" color="primary" />
      </q-card-actions>
    </q-card>
  </q-form>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import { useI18n } from 'vue-i18n'
import { type FabricEventPayload } from 'src/stores/annotation';


const { t } = useI18n()

const props = defineProps<{
  modelValue: FabricEventPayload
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: FabricEventPayload): void
  (e: 'submit', val: FabricEventPayload): void
}>()

const form = ref({ ...props.modelValue })

watch(() => props.modelValue, (newVal) => {
  form.value = { ...newVal }
})

function emitUpdated() {
  emit('update:modelValue', form.value)
  emit('submit', form.value)
}
</script>
