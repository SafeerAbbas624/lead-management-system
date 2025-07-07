// Mock API functions that simulate backend calls
// These will be replaced with actual API calls in production

interface UploadBatch {
  id: number
  filename: string
  filetype: string
  status: string
  totalleads: number
  cleanedleads: number
  duplicateleads: number
  dncmatches: number
  processingprogress: number
  supplierid: number
  sourcename: string
  createdat: string
  completedat?: string
  errormessage?: string
}

interface Supplier {
  id: number
  name: string
  email: string
  contactperson: string
  status: string
  leadcost: string
  createdat: string
}

interface Client {
  id: number
  name: string
  email: string
  phone: string
  contactperson: string
  deliveryformat: string
  deliveryschedule: string
  percentallocation?: number
  fixedallocation?: number
  isactive: boolean
  createdat: string
}

interface DNCList {
  id: number
  name: string
  type: string
  description: string
  isactive: boolean
  createdat: string
  lastupdated: string
}

interface DNCEntry {
  id: number
  value: string
  valuetype: string
  source: string
  reason: string
  dnclistid: number
  createdat: string
  expirydate?: string
}

// Mock data
const mockUploadBatches: UploadBatch[] = [
  {
    id: 1,
    filename: "leads_batch_1.csv",
    filetype: "csv",
    status: "Completed",
    totalleads: 150,
    cleanedleads: 130,
    duplicateleads: 15,
    dncmatches: 5,
    processingprogress: 100,
    supplierid: 1,
    sourcename: "Website Forms",
    createdat: "2024-01-15T10:30:00Z",
    completedat: "2024-01-15T10:45:00Z",
  },
  {
    id: 2,
    filename: "leads_batch_2.xlsx",
    filetype: "xlsx",
    status: "Processing",
    totalleads: 200,
    cleanedleads: 0,
    duplicateleads: 0,
    dncmatches: 0,
    processingprogress: 45,
    supplierid: 2,
    sourcename: "Social Media",
    createdat: "2024-01-16T14:20:00Z",
  },
]

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: "Premium Leads Co",
    email: "contact@premiumleads.com",
    contactperson: "John Smith",
    status: "Active",
    leadcost: "25.50",
    createdat: "2023-01-15T00:00:00Z",
  },
  {
    id: 2,
    name: "Quality Data Inc",
    email: "sales@qualitydata.com",
    contactperson: "Jane Doe",
    status: "Active",
    leadcost: "30.00",
    createdat: "2023-03-22T00:00:00Z",
  },
]

const mockClients: Client[] = [
  {
    id: 1,
    name: "TechCorp Solutions",
    email: "purchasing@techcorp.com",
    phone: "(555) 123-4567",
    contactperson: "Mike Johnson",
    deliveryformat: "CSV",
    deliveryschedule: "Daily",
    percentallocation: 30,
    isactive: true,
    createdat: "2023-02-15T00:00:00Z",
  },
  {
    id: 2,
    name: "Marketing Pro Inc",
    email: "leads@marketingpro.com",
    phone: "(555) 987-6543",
    contactperson: "Sarah Wilson",
    deliveryformat: "JSON",
    deliveryschedule: "Weekly",
    fixedallocation: 100,
    isactive: true,
    createdat: "2023-04-22T00:00:00Z",
  },
]

const mockDNCLists: DNCList[] = [
  {
    id: 1,
    name: "Federal DNC Registry",
    type: "federal",
    description: "Official federal do not call registry",
    isactive: true,
    createdat: "2023-01-01T00:00:00Z",
    lastupdated: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Internal DNC List",
    type: "internal",
    description: "Company internal do not contact list",
    isactive: true,
    createdat: "2023-01-01T00:00:00Z",
    lastupdated: "2024-01-15T00:00:00Z",
  },
]

const mockDNCEntries: DNCEntry[] = [
  {
    id: 1,
    value: "noemail@example.com",
    valuetype: "email",
    source: "Customer Request",
    reason: "Requested removal",
    dnclistid: 2,
    createdat: "2024-01-10T00:00:00Z",
  },
  {
    id: 2,
    value: "5551234567",
    valuetype: "phone",
    source: "Federal Registry",
    reason: "Federal DNC registration",
    dnclistid: 1,
    createdat: "2024-01-05T00:00:00Z",
  },
]

// API functions
export const uploadBatchesApi = {
  getUploadBatches: async (): Promise<UploadBatch[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return mockUploadBatches
  },

  createUploadBatch: async (batchData: Partial<UploadBatch>): Promise<UploadBatch> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newBatch: UploadBatch = {
      id: mockUploadBatches.length + 1,
      filename: batchData.filename || "",
      filetype: batchData.filetype || "",
      status: batchData.status || "Uploaded",
      totalleads: batchData.totalleads || 0,
      cleanedleads: batchData.cleanedleads || 0,
      duplicateleads: batchData.duplicateleads || 0,
      dncmatches: batchData.dncmatches || 0,
      processingprogress: batchData.processingprogress || 0,
      supplierid: batchData.supplierid || 0,
      sourcename: batchData.sourcename || "",
      createdat: new Date().toISOString(),
    }
    mockUploadBatches.push(newBatch)
    return newBatch
  },

  processFile: async (filePath: string, batchId: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const batch = mockUploadBatches.find((b) => b.id === batchId)
    if (batch) {
      batch.status = "Completed"
      batch.processingprogress = 100
      batch.totalleads = 150
      batch.cleanedleads = 130
      batch.duplicateleads = 15
      batch.dncmatches = 5
      batch.completedat = new Date().toISOString()
    }
  },
}

export const suppliersApi = {
  getSuppliers: async (activeOnly = false): Promise<Supplier[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return activeOnly ? mockSuppliers.filter((s) => s.status === "Active") : mockSuppliers
  },

  createSupplier: async (supplierData: Partial<Supplier>): Promise<Supplier> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newSupplier: Supplier = {
      id: mockSuppliers.length + 1,
      name: supplierData.name || "",
      email: supplierData.email || "",
      contactperson: supplierData.contactperson || "",
      status: supplierData.status || "Active",
      leadcost: supplierData.leadcost || "0.00",
      createdat: new Date().toISOString(),
    }
    mockSuppliers.push(newSupplier)
    return newSupplier
  },
}

export const clientsApi = {
  getClients: async (activeOnly = false): Promise<Client[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return activeOnly ? mockClients.filter((c) => c.isactive) : mockClients
  },

  createClient: async (clientData: Partial<Client>): Promise<Client> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newClient: Client = {
      id: mockClients.length + 1,
      name: clientData.name || "",
      email: clientData.email || "",
      phone: clientData.phone || "",
      contactperson: clientData.contactperson || "",
      deliveryformat: clientData.deliveryformat || "CSV",
      deliveryschedule: clientData.deliveryschedule || "Manual",
      percentallocation: clientData.percentallocation,
      fixedallocation: clientData.fixedallocation,
      isactive: clientData.isactive !== false,
      createdat: new Date().toISOString(),
    }
    mockClients.push(newClient)
    return newClient
  },
}

export const dncListsApi = {
  getDncLists: async (): Promise<DNCList[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockDNCLists
  },

  createDncList: async (listData: Partial<DNCList>): Promise<DNCList> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newList: DNCList = {
      id: mockDNCLists.length + 1,
      name: listData.name || "",
      type: listData.type || "custom",
      description: listData.description || "",
      isactive: listData.isactive !== false,
      createdat: new Date().toISOString(),
      lastupdated: new Date().toISOString(),
    }
    mockDNCLists.push(newList)
    return newList
  },

  updateDncList: async (id: number, listData: Partial<DNCList>): Promise<DNCList> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const index = mockDNCLists.findIndex((l) => l.id === id)
    if (index === -1) throw new Error("DNC list not found")

    mockDNCLists[index] = { ...mockDNCLists[index], ...listData, lastupdated: new Date().toISOString() }
    return mockDNCLists[index]
  },

  deleteDncList: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const index = mockDNCLists.findIndex((l) => l.id === id)
    if (index === -1) throw new Error("DNC list not found")
    mockDNCLists.splice(index, 1)
  },
}

export const dncEntriesApi = {
  getDncEntries: async (dncListId: number): Promise<DNCEntry[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockDNCEntries.filter((e) => e.dnclistid === dncListId)
  },

  createDncEntry: async (entryData: Partial<DNCEntry>): Promise<DNCEntry> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newEntry: DNCEntry = {
      id: mockDNCEntries.length + 1,
      value: entryData.value || "",
      valuetype: entryData.valuetype || "email",
      source: entryData.source || "",
      reason: entryData.reason || "",
      dnclistid: entryData.dnclistid || 0,
      createdat: new Date().toISOString(),
      expirydate: entryData.expirydate,
    }
    mockDNCEntries.push(newEntry)
    return newEntry
  },

  deleteDncEntry: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const index = mockDNCEntries.findIndex((e) => e.id === id)
    if (index === -1) throw new Error("DNC entry not found")
    mockDNCEntries.splice(index, 1)
  },
}

export const distributionApi = {
  getDistributions: async (): Promise<any[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return [
      {
        id: 1,
        batchid: 1,
        clientid: 1,
        leadsallocated: 50,
        deliverystatus: "Delivered",
        deliverydate: "2024-01-15T11:00:00Z",
        createdat: "2024-01-15T10:45:00Z",
      },
      {
        id: 2,
        batchid: 1,
        clientid: 2,
        leadsallocated: 80,
        deliverystatus: "Pending",
        deliverydate: null,
        createdat: "2024-01-15T10:45:00Z",
      },
    ]
  },

  distributeLeads: async (batchId: number, clientIds: number[]): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const distributions = clientIds.map((clientId, index) => ({
      id: Date.now() + index,
      batchid: batchId,
      clientid: clientId,
      leadsallocated: Math.floor(Math.random() * 50) + 10,
      deliverystatus: "Delivered",
      deliverydate: new Date().toISOString(),
      createdat: new Date().toISOString(),
    }))

    return {
      batchId,
      totalLeads: distributions.reduce((sum, d) => sum + d.leadsallocated, 0),
      distributions,
    }
  },
}

export const roiApi = {
  getROIMetrics: async (): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      totalRevenue: 125000,
      totalCost: 45000,
      netProfit: 80000,
      roi: 177.8,
      totalLeads: 1500,
      costPerLead: 30,
      revenuePerLead: 83.33,
    }
  },

  getSupplierPerformance: async (): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      topSuppliers: [
        { name: "Premium Leads Co", leads: 500, revenue: 45000, roi: 180 },
        { name: "Quality Data Inc", leads: 400, revenue: 35000, roi: 165 },
        { name: "Fast Leads LLC", leads: 300, revenue: 25000, roi: 150 },
      ],
      bottomSuppliers: [
        { name: "Cheap Leads Co", leads: 200, revenue: 8000, roi: 45 },
        { name: "Budget Data Inc", leads: 100, revenue: 3000, roi: 30 },
      ],
    }
  },
}
