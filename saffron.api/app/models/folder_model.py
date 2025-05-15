from pydantic import BaseModel, ConfigDict
from typing import Optional

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    class Config(ConfigDict):
        from_attributes = True

class FolderUpdate(BaseModel):
    name: str
    is_active: bool = True
    class Config(ConfigDict):
        from_attributes  = True
