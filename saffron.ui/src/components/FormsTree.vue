<template>
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
      <q-item clickable v-ripple @click="navigateTo(props.node.to)">
        <q-item-section avatar>
          <q-icon :name="props.node.icon" />
        </q-item-section>
        <q-item-section>
          {{ props.node.label }}
        </q-item-section>
      </q-item>
    </template>
  </q-tree>
</template>
<script setup lang="ts">
import { type RouteLocationRaw, useRouter } from 'vue-router';
const router = useRouter();

const navigateTo = async (to: RouteLocationRaw) => {
  if (to) await router.push(to);
};

const treeData = [
  {
    id: 'my-forms',
    label: 'My Forms',
    icon: 'assignment',
    to: '/fb',
    children: [
      {
        id: 'form-1',
        label: 'Form A',
        icon: 'description',
        to: '/fb/form-a',
      },
      {
        id: 'form-2',
        label: 'Form B',
        icon: 'description',
        to: '/fb/form-b',
      },
    ],
  },
];
</script>
