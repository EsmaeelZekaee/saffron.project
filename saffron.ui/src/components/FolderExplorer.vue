<template>
  <div class="column full-height">
    <q-bar >
      <q-space></q-space>
      <q-btn
        class="q-pa-none"
        flat
        color="primary"
        icon="fa-solid fa-file-circle-plus"
        @click.prevent.stop="handleNewFolder"
      ></q-btn>
    </q-bar>
    <div
      class="col q-pa-sm scroll"
      style="overflow-y: auto; height: 500px"
      @click="folderStore.select(null)"
    >
      <q-tree
        ref="treeRef"
        dir="rtl"
        :nodes="folders"
        class="explorer-tree-style"
        node-key="id"
        dense
        label-key="label"
        v-model:selected="selectedKey"
        default-expand-all
        :tick-strategy="'none'"
        :expanded="expandedFolders"
        @update:expanded="(val) => (expandedFolders = [...val])"
        no-connectors
      >
        <template v-slot:header-icon="{ expanded, node }">
          <q-icon
            v-if="node.id"
            :name="expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"
          />
        </template>
        <template v-slot:default-header="{ node }">
          <q-item
            :class="['q-tree-node', nodeIndexClass(node), { 'text-grey': node._pending }]"
            :q-data-node-key="node.id"
            dense
            class="full-width"
            clickable
            v-ripple
            :active="folderStore.selectedFolder === node"
            @contextmenu.prevent.stop="contextMenu($event, node)"
            @click.prevent.stop="selectNode($event, node)"
          >
            <q-item-section @dblclick="editPopup?.show()">
              <div class="row items-center justify-between full-width no-wrap">
                <div class="text-body1">
                  <div class="cursor-pointer">
                    {{ node.label }}
                    <q-popup-edit
                      v-if="node.id"
                      ref="editPopup"
                      v-model="node.label"
                      auto-save
                      fit
                      :touch-position="true"
                      v-slot="scope"
                    >
                      <q-input
                        v-model="scope.value"
                        dense
                        autofocus
                        counter
                        @keyup.enter="handleRename(scope)"
                      />
                    </q-popup-edit>
                  </div>
                </div>
              </div>
            </q-item-section>
          </q-item>
        </template>
      </q-tree>
    </div>
  </div>
  <q-menu ref="menuRef" :anchor="menuAnchor" self="top left" fit :context-menu="true">
    <q-list dense style="min-width: 150px">
      <q-item clickable v-close-popup>
        <q-item-section @click="handelRefresh">{{ $t('public.refresh') }}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup>
        <q-item-section @click="handleDeleteFolder">{{ $t('public.delete') }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script setup lang="ts">
interface IScope {
  set: () => void;
  cancel: () => void;
  value: string;
}
import {  QMenu, QTree, type QTreeNode, useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';

import { nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFolderStore } from 'src/stores/folder';
import { storeToRefs } from 'pinia';
const { t } = useI18n();
const folderStore = useFolderStore();
const { folders, expandedFolders } = storeToRefs(folderStore);
const editPopup = ref();
const menuAnchor = 'top right';
const router = useRouter();
const route = useRoute();
const selectedKey = ref<string | null>(null);
const menuRef = ref<QMenu | null>(null);
const treeRef = ref<QTree | null>(null);
import { showAsyncConfirm } from 'src/utils/showAsyncConfirm'

const contextMenu = (event: Event, node: QTreeNode) => {
  folderStore.select(node);
  menuRef.value?.show(event);
};
const selectNode = async (event: Event, node: QTreeNode) => {
  menuRef.value?.hide();
  folderStore.select(node);
  await router.push({ name: 'Forms-Files', params: { folderId: folderStore.selectedFolder?.id } });
};

watch(
  () => folderStore.folders,
  async (nodes) => {
    if (nodes.length > 0) {
      await nextTick();
      selectedKey.value = route.params.folderId as string;
      folderStore.select(findNodeByKey(treeRef.value?.nodes as QTreeNode[], selectedKey.value));
      await delay(500);
      await scrollToNode(folderStore.selectedFolder as QTreeNode);
    }
  },
);
function nodeIndexClass(node: QTreeNode) {
  return node.id === null ? 'sticky-node' : '';
}
function findNodeByKey(nodes: QTreeNode[], key: string | undefined): QTreeNode | null {
  for (const node of nodes) {
    if (node.id === key) return node;
    if (node.children) {
      const found = findNodeByKey(node.children, key);
      if (found) {
        expandedFolders.value.push(node.id);
        return found;
      }
    }
  }
  return null;
}

const $q = useQuasar();

const handleRename = async (scope: IScope) => {
  scope.set();
  await folderStore.ren(scope.value);
  $q.notify({
    type: folderStore.status === 'success' ? 'positive' : 'negative',
    group: false,
    message: t(folderStore.message),
  });
};
const handleDeleteFolder =  () => {
  showAsyncConfirm({
    message: t('folders.delete.confirmation'),
    onConfirm: async () => {
        await folderStore.del();
    },
    onCancel: () => {
    }
  })
};

const handelRefresh = async () => {
  await folderStore.list();
};
const handleNewFolder = async () => {
  await folderStore.make(t('folders.default.filename'));
  if (folderStore.status === 'fail')
    $q.notify({
      type: 'negative',
      group: false,
      message: t(folderStore.message),
    });
  if (folderStore.selectedFolder) await scrollToNode(folderStore.selectedFolder);
};

async function scrollToNode(node: QTreeNode) {
  const root = treeRef.value?.$el;
  if (!root || !node) return;

  const selector = `[q-data-node-key="${node.id}"]`;

  const el = await waitForElement(selector, root);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function waitForElement(selector: string, root: HTMLElement): Promise<Element> {
  return new Promise((resolve) => {
    const el = root.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });
  });
}
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
onMounted(async () => {
  await folderStore.list();
});
</script>
<style>
.explorer-tree-style.q-tree--dense .q-tree__children {
  padding-right: 1px !important;
  padding-left: 10px !important;
}
.q-tree-node {
  padding-right: 0px !important;
  padding-left: 0px !important;
}
.q-tree .q-tree__tickbox {
  display: none !important;
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}
.sticky-node {
  position: sticky;
  top: 0;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>
