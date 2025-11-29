export interface Property {
  id: string;
  client_id: string;
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  property_type?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithClient extends Property {
  client: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export type PropertyInsert = Omit<Property, 'id' | 'created_at' | 'updated_at'>;
export type PropertyUpdate = Partial<PropertyInsert>;

export type PropertyType =
  | 'Residential'
  | 'Commercial'
  | 'Condo'
  | 'Apartment'
  | 'Townhouse'
  | 'Other';
