<template>
  <q-toolbar flat dense>
    <q-toolbar-title>
      {{ $t('forms.toolbar.title') }}
    </q-toolbar-title>
  </q-toolbar>
  <div style="min-height: 400px; max-height: 400px; overflow-y: scroll">
    <q-tree
      ref="treeRef"
      :nodes="treeData"
      node-key="id"
      dense
      label-key="label"
      v-model:selected="selectedKey"
      default-expand-all
      :tick-strategy="'none'"
      :expanded="expanded"
      @update:expanded="(val) => (expanded = [...val])"
      no-connectors
    >
      <template v-slot:default-header="{ node }">
        <q-item
          :q-data-node-key="node.id"
          dir="ltr"
          dense
          class="full-width"
          clickable
          v-ripple
          :class="{ 'text-grey': node._pending }"
          :active="selectedNode === node"
          @contextmenu.prevent.stop="contextMenu($event, node)"
          @click.prevent.stop="selectNode($event, node)"
        >
          <q-item-section avatar>
            <q-icon :name="node.icon" />
          </q-item-section>
          <q-item-section @dblclick="editPopup?.show()">
            <div class="row items-center justify-between full-width no-wrap">
              <div class="text-body1">
                <div class="cursor-pointer">
                  {{ node.label }}
                  <q-popup-edit
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
              <q-btn-group flat v-if="selectedNode === node && node.icon === 'folder'">
                <q-btn
                  dense
                  flat
                  icon="create_new_folder"
                  @click.prevent.stop="handleNewFolder"
                  class="q-pa-none"
                />
                <q-btn
                  dense
                  flat
                  @click.prevent.stop="handleNewFile()"
                  icon="note_add"
                  color="secondary"
                  class="q-pa-none"
                />
              </q-btn-group>
            </div>
          </q-item-section>
        </q-item>
      </template>
    </q-tree>
  </div>
  <q-menu ref="menuRef" :anchor="menuAnchor" self="top left" fit :context-menu="true">
    <q-list dense style="min-width: 150px">
      <q-item clickable v-close-popup>
        <q-item-section>ویرایش</q-item-section>
      </q-item>
      <q-item clickable v-close-popup>
        <q-item-section @click="handleDeleteFolder">حذف</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script setup lang="ts">
interface IScope {
  set: () => void;
  cancel: () => void;
}
import { QMenu, QTree, type QTreeNode, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useRouter, useRoute } from 'vue-router';

import { nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const editPopup = ref();
const menuAnchor = 'top right';
const router = useRouter();
const route = useRoute();
const selectedKey = ref<string | null>(null);

const contextMenu = (event: Event, node: QTreeNode) => {
  selectedNode.value = node;
  menuRef.value?.show(event);
};
const selectNode = async (event: Event, node: QTreeNode) => {
  menuRef.value?.hide();
  selectedNode.value = node;
  await router.push({ name: 'Forms-Files', params: { nodeId: selectedNode.value.id } });
};

watch(
  () => route.params.nodeId,
  (newId) => {
    if (newId) {
      console.log(newId, typeof newId);
      if (typeof newId !== typeof '' || newId === null) return;
      setTimeout(() => {
        selectedKey.value = newId as string;
        selectedNode.value = findNodeByKey(treeRef.value?.nodes as QTreeNode[], selectedKey.value);
        console.log(treeRef.value?.nodes);
      }, 500);
    }
  },
  { immediate: true },
);

const menuRef = ref<QMenu | null>(null);
const treeRef = ref<QTree | null>(null);
const selectedNode = ref<QTreeNode | null>(null);
const expanded = ref<string[]>([]);

function findNodeByKey(nodes: QTreeNode[], key: string | undefined): QTreeNode | null {
  for (const node of nodes) {
    if (node.id === key) return node;
    if (node.children) {
      const found = findNodeByKey(node.children, key);
      if (found) {
        expanded.value.push(node.id);
        return found;
      }
    }
  }
  return null;
}

const { t } = useI18n();
const $q = useQuasar();
const treeData = ref<QTreeNode[]>([]);
interface RFolderItem {
  _id: string | null;
  name: string;
  parent_id: string | null;
}
const handleRename = async (scope: IScope) => {
  if (!selectedNode.value) return;
  selectedNode.value._pending = true;
  try {
    scope.set();
    await api.put(`/api/v1/folders/${selectedNode.value.id}`, { name: selectedNode.value.label });
  } catch {
    scope.cancel();
    $q.notify({
      type: 'negative',
      message: t('folders.update.failed'),
    });
  }
  selectedNode.value._pending = false;
};
const scrollToNode = async (node: QTreeNode) => {
  const root = treeRef.value?.$el;
  if (!root || !node) return;

  const selector = `[q-data-node-key="${node.id}"]`;

  const el = await waitForElement(selector, root);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
const handleDeleteFolder = async () => {
  try {
    if (!selectedNode.value) return;
    const id = selectedNode.value?.id;
    selectedNode.value._pending = true;
    await api.delete(`/api/v1/folders/${id}`);
  } catch {
    $q.notify({
      type: 'negative',
      message: t('folders.create.failed'),
    });
  }
};
const handleNewFile = () => {
  if (!selectedNode.value) return;
  selectedNode.value.children ||= [];
  if (!expanded.value.includes(selectedNode.value.id)) expanded.value.push(selectedNode.value.id);
  selectedNode.value.children.push({
    id: null,
    label: t('folders.newFileName'),
    icon: 'file',
  });
  selectedNode.value = selectedNode.value.children[
    selectedNode.value.children.length - 1
  ] as QTreeNode;
};
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

const addFolder = async () => {
  try {
    const parent_id = selectedNode.value?.id;
    const node = { name: t('folders.newFolderName'), parent_id: parent_id };
    const res = await api.post('/api/v1/folders', node);
    return res.data.folder;
  } catch {
    $q.notify({
      type: 'negative',
      message: t('folders.create.failed'),
    });
  }
};
const beginAddNewNode = async (icon: string) => {
  if (!selectedNode.value) return;
  selectedNode.value.children ||= [];
  if (!expanded.value.includes(selectedNode.value.id)) {
    expanded.value.push(selectedNode.value.id);
    await delay(500);
    await nextTick();
  }
  const tempId = `temp-${Date.now()}-${Math.random()}`;
  const tempNode = {
    id: tempId,
    label: t('folders.creating'),
    icon: icon,
    children: [],
    _pending: true,
  };
  selectedNode.value?.children?.push(tempNode);
  return tempId;
};
const endAddNewNode = async (tempId: string, node: { id: string; label: string, icon: string }) => {
  if (!selectedNode.value) return;
  selectedNode.value.children ||= [];
  const index = selectedNode?.value.children?.findIndex((n) => n.id === tempId);

  if (index !== -1) {
    selectedNode.value.children[index] = {
      ...{ id: node.id, label: node.label, icon: node.icon },
      children: [],
    };
  }
  selectedNode.value = selectedNode.value.children[
    selectedNode.value.children.length - 1
  ] as QTreeNode;
  await scrollToNode(selectedNode.value);
};
const handleNewFolder = async () => {
  const tempId = await beginAddNewNode('folder');
  if (!tempId) return;
  const folder = await addFolder();
  if (folder == undefined) return;
  await endAddNewNode(tempId, { id: folder._id, label: folder.name , icon: 'folder'});
};

const fetchData = async () => {
  try {
    const folders = await api
      .get('/api/v1/folders')
      .then((res) => {
        if (res.status === 200) return res.data;
        return { folders: undefined };
      })
      .then((res) => res.folders as RFolderItem[]);

    treeData.value = [
      {
        label: t('forms.toolbar.title'),
        icon: 'account_tree',
        children: buildTree(folders),
      },
    ];

    function buildTree(items: RFolderItem[], parentId: string | null = null): QTreeNode[] {
      return items
        .filter((item) => item.parent_id === parentId)
        .map((item) => ({
          id: item._id,
          label: item.name,
          icon: 'folder',
          children: buildTree(items, item._id),
        }));
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: t('folders.list.failed'),
    });
  }
};
onMounted(async () => {
  await fetchData();
});
</script>
