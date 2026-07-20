from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from app.models.parent_child import LinkStatus

class ParentChildLinkRequest(BaseModel):
    parent_email: str

class ParentChildLinkResponse(BaseModel):
    id: UUID
    parent_id: UUID
    child_id: UUID
    status: LinkStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
