from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any, Union, Literal
from datetime import datetime
import re
from enum import Enum

class ProcessFileRequest(BaseModel):
    filePath: str
    batchId: int
    reprocess: bool = False
    cleaningOptions: Optional[Dict[str, bool]] = None

class ProcessFileResponse(BaseModel):
    success: bool
    batchId: int
    totalLeads: int
    cleanedLeads: int
    duplicateLeads: int
    dncMatches: int
    message: Optional[str] = None

class DNCCheckRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None

    @validator('email', 'phone')
    def validate_at_least_one(cls, v, values):
        if not v and not values.get('email') and not values.get('phone'):
            raise ValueError('At least one of email or phone must be provided')
        return v

class DNCCheckResponse(BaseModel):
    isDNC: bool
    dncLists: List[int]
    email: Optional[str] = None
    phone: Optional[str] = None

class DNCListType(str, Enum):
    internal = "internal"
    federal = "federal"
    client = "client"
    custom = "custom"

class DNCListCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    isActive: bool = True

class DNCEntryCreate(BaseModel):
    value: str
    valueType: str
    source: Optional[str] = None
    reason: Optional[str] = None
    dncListId: int
    expiryDate: Optional[datetime] = None

class DNCListBulkUploadRequest(BaseModel):
    filePath: str
    dncListId: int
    valueType: str

class LeadDistributionRequest(BaseModel):
    batchId: int
    clientIds: List[int]
    scheduleDelivery: bool = False
    deliveryTime: Optional[datetime] = None

class LeadDistributionResponse(BaseModel):
    batchId: int
    totalLeads: int
    distributions: List[Dict[str, Any]]

class LeadTag(str, Enum):
    hot = "hot"
    warm = "warm"
    cold = "cold"
    qualified = "qualified"
    unqualified = "unqualified"
    contacted = "contacted"
    converted = "converted"
    custom = "custom"

class LeadTagRequest(BaseModel):
    leadIds: List[int]
    tag: str
    value: Optional[str] = None

class RevenueUploadRequest(BaseModel):
    filePath: str
    fileType: str

class ROIMetricsRequest(BaseModel):
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    suppliers: Optional[List[int]] = None
    clients: Optional[List[int]] = None
    sources: Optional[List[str]] = None

class LeadEnrichmentRequest(BaseModel):
    leadIds: List[int]
    enrichmentProvider: str
    fields: Optional[List[str]] = None

class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    viewer = "viewer"
    supplier = "supplier"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    fullName: str
    role: str

class APIKeyCreate(BaseModel):
    name: str
    permissions: List[str]
    expiryDate: Optional[datetime] = None

class Lead(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    companyname: Optional[str] = None
    taxid: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None
    country: Optional[str] = None
    leadstatus: str = "New"
    leadsource: Optional[str] = None
    leadscore: Optional[int] = None
    leadcost: Optional[float] = None
    exclusivity: bool = False
    exclusivitynotes: Optional[str] = None
    uploadbatchid: int
    clientid: Optional[int] = None
    supplierid: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: List[str] = []
    createdat: datetime = Field(default_factory=datetime.now)
    updatedat: Optional[datetime] = None
    
    @validator('email')
    def email_must_be_valid(cls, v):
        return v
    
    @validator('phone')
    def phone_must_be_valid(cls, v):
        if not v:
            return v
        if not any(c.isdigit() for c in v):
            raise ValueError('Phone number must contain at least one digit')
        return v

class UploadBatch(BaseModel):
    filename: str
    filetype: str
    status: str = "Uploaded"
    totalleads: int = 0
    cleanedleads: int = 0
    duplicateleads: int = 0
    dncmatches: int = 0
    errormessage: Optional[str] = None
    originalheaders: Optional[List[str]] = None
    mappingrules: Optional[Dict[str, Any]] = None
    uploadedby: Optional[int] = None
    processingprogress: int = 0
    supplierid: Optional[int] = None
    sourcename: Optional[str] = None
    createdat: datetime = Field(default_factory=datetime.now)
    completedat: Optional[datetime] = None

class Supplier(BaseModel):
    name: str
    email: str
    contactperson: Optional[str] = None
    apikey: Optional[str] = None
    status: str = "Active"
    leadcost: Optional[str] = None
    createdat: datetime = Field(default_factory=datetime.now)

class Client(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    contactperson: Optional[str] = None
    deliveryformat: str = "CSV"
    deliveryschedule: str = "Manual"
    percentallocation: Optional[int] = None
    fixedallocation: Optional[int] = None
    exclusivitysettings: Optional[Dict[str, Any]] = None
    isactive: bool = True
    createdat: datetime = Field(default_factory=datetime.now)

class DNCList(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    isactive: bool = True
    createdat: datetime = Field(default_factory=datetime.now)
    lastupdated: datetime = Field(default_factory=datetime.now)

class DNCEntry(BaseModel):
    value: str
    valuetype: str
    source: str
    reason: Optional[str] = None
    dnclistid: int
    createdat: datetime = Field(default_factory=datetime.now)
    expirydate: Optional[datetime] = None

class WebhookCreate(BaseModel):
    name: str
    url: str
    events: List[str]
    secret: Optional[str] = None

class SystemSettingsUpdate(BaseModel):
    general: Optional[Dict[str, Any]] = None
    processing: Optional[Dict[str, Any]] = None
    dnc: Optional[Dict[str, Any]] = None
    distribution: Optional[Dict[str, Any]] = None
    notifications: Optional[Dict[str, Any]] = None
    api: Optional[Dict[str, Any]] = None

class JWTPayload(BaseModel):
    sub: str
    role: Optional[str] = "user"
    exp: Optional[int] = None
    iat: Optional[int] = None
    aud: Optional[str] = None
    iss: Optional[str] = None

# New models for the enhanced upload workflow
class DuplicateCheckRequest(BaseModel):
    data: List[Dict[str, Any]]
    checkFields: List[str]

class AutoMappingRequest(BaseModel):
    headers: List[str]
    sampleData: Optional[List[Dict[str, Any]]] = None

class ProcessLeadsRequest(BaseModel):
    data: List[Dict[str, Any]]
    mappings: List[Dict[str, Any]]
    filename: str
    normalization_settings: Optional[Dict[str, Any]] = None
    tagging_settings: Optional[Dict[str, Any]] = None
    cleaning_settings: Optional[Dict[str, Any]] = None
    source: Optional[str] = "file_upload"
    supplier_id: Optional[int] = None
    user_id: Optional[int] = None
