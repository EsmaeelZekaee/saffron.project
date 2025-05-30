export interface FolderModel {
  id: string;
  name: string;
  parent_id: string;
}

export interface FileModel {
  id: string;
  name: string;
  type: string;
  folder_id: string;
}