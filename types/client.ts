export interface Client {
  id?: number;
  name: string;
  email: string;
  phone?: string | null;
  contactperson?: string | null;
  deliveryformat?: string | null;
  deliveryschedule?: string | null;
  percentallocation?: number | null;
  fixedallocation?: number | null;
  exclusivitysettings?: Record<string, any> | null;
  isactive: boolean;
  createdat?: string;
}

export interface ClientFormData extends Omit<Client, 'id' | 'createdat'> {}

export interface ClientResponse {
  data: Client[];
  count: number;
}

export interface ClientFilters {
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
