import { defineStore, acceptHMRUpdate } from 'pinia';
import { api } from '../boot/axios'

import { type QTreeNode } from 'quasar';
import axios from 'axios';

export interface IFolderModel {
  _id: string | null;
  name: string;
  parent_id: string | null;
}

export interface IFileModel {
  _id: string | null;
  folder_id: string;
  original_filename: string;
  saved_filename: string;
  upload_path: string;
  title: string;
  checksum: string,
  uploaded_at: string;
}

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [] as QTreeNode[],
    selectedFolder: null as QTreeNode | null,
    selectedFile: null as IFileModel | null,
    status: null as 'success' | 'fail' | null,
    message: '' as string,
    expandedFolders: <string[]>([])
  }),

  actions: {

    async make(name: string) {
      let root = this.folders as QTreeNode[];
      if (this.selectedFolder) {
        this.selectedFolder.children ||= []
        root = this.selectedFolder.children as QTreeNode[];
      }
      if (this.selectedFolder)
        this.expandedFolders.push(this.selectedFolder.id)
      try {

        const tempId = `${Math.random()}`
        root.push({
          icon: 'folder',
          label: name,
          id: tempId,
          _pending: true
        })

        const parent_id = this.selectedFolder?.id;
        console.log(parent_id)
        const node = { name: name, parent_id: parent_id };
        const res = await api.post('/api/v1/folders', node);

        root.pop()
        const { folder } = res.data;
        root.push({
          icon: 'folder',
          label: folder.name,
          id: folder._id,
        })

        this.selectedFolder = root[root.length - 1] as QTreeNode

        this.status = 'success';
        this.message = 'folder.make.succeed';
        return true;

      } catch {
        this.status = 'fail';
        this.message = 'folder.make.fail';
        return false;
      }
    },
    select(node: QTreeNode | null) {
      this.selectedFolder = node;
    },
    async list(root: string) {
      console.log(root)
      const folders = await api
        .get('/api/v1/folders')
        .then((res) => {
          if (res.status === 200) return res.data;
          return { folders: undefined };
        })
        .then((res) => res.folders as IFolderModel[]);

      this.folders = buildTree(folders)

      function buildTree(items: IFolderModel[], parentId: string | null = null): QTreeNode[] {
        return items
          .filter((item) => item.parent_id === parentId)
          .map((item) => ({
            id: item._id,
            label: item.name,
            icon: 'folder',
            children: buildTree(items, item._id) || [],
          }));
      }
    },
    async ren(name: string): Promise<boolean> {
      if (!this.selectedFolder) {
        this.status = 'fail';
        this.message = 'folder.not.selected';
        return false;
      }
      this.selectedFolder._pending = true;

      try {
        await api.put(`/api/v1/folders/${this.selectedFolder.id}`, { name: name });

        this.status = 'success';
        this.message = 'folder.renamed.succeed';
        return true;

      } catch {
        this.status = 'fail';
        this.message = 'folder.renamed.failed';
        return false;

      } finally {
        this.selectedFolder._pending = false;
      }
    },
    async del() {
      if (!this.selectedFolder) {
        this.status = 'fail';
        this.message = 'folder.not.selected';
        return false;
      }
      this.selectedFolder._pending = true;

      try {
        await api.delete(`/api/v1/folders/${this.selectedFolder.id}`);
        const parent = this.getParent(this.selectedFolder.id)
        if (parent?.children?.length) parent.children = parent.children.filter(x => x.id !== this.selectedFolder?.id)

        this.selectedFolder = parent;
        this.status = 'success';
        this.message = 'folder.del.succeed';
        return true;

      } catch {
        this.status = 'fail';
        this.message = 'folder.del.failed';
        return false;

      }
    },

    async createFile(form: FormData) {
      if (!this.selectedFolder) {
        this.status = 'fail';
        this.message = 'folder.not.selected';
        return false;
      }
      try {
        form.set("folder_id", this.selectedFolder.id);
        await api.post('api/v1/media/files', form, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        this.status = 'success';
        this.message = 'file.create.succeed';
        return true;
      } catch (err) {
        this.status = 'fail';
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          this.message = 'file.upload.duplicated';
        }
        else {
          this.message = 'file.create.failed';
        }
        return true;
      }
    },

   
    async getSelectedFile() {
      if (!this.selectedFolder) {
        this.status = 'fail';
        this.message = 'folder.not.selected';
        return false;
      }

      try {
        const res = await api.get(`api/v1/media/files/last?folder_id=${this.selectedFolder.id}`)
        this.selectedFile = res.data.file

        this.status = 'success';
        this.message = 'file.get.succeed';
        return true;

      } catch {
        this.status = 'fail';
        this.message = 'file.get.failed';
        return false;

      }
    },

    getParent(childId: string): QTreeNode | null {
      return findParent(this.folders, childId)
      function findParent(nodes: QTreeNode[], childId: string, parent: QTreeNode | null = null): QTreeNode | null {
        for (const node of nodes) {
          if (node.id === childId) {
            return parent;
          }
          if (node.children) {
            const found = findParent(node.children, childId, node);
            if (found) return found;
          }
        }
        return null;
      }
    }
  },

});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFolderStore, import.meta.hot));
}
