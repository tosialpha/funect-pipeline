// Database types for Funect Sales Pipeline
// These match the schema in supabase/migrations/001_initial_schema.sql

export type UserRole = 'admin' | 'salesperson';

export type PipelineStage =
  | 'cold_call'
  | 'short_demo'
  | 'long_demo'
  | 'offer_sent'
  | 'closed_won'
  | 'closed_lost';

export type Priority = 'high' | 'medium' | 'low';

export type ActivityType =
  | 'call'
  | 'email'
  | 'demo'
  | 'meeting'
  | 'reminder'
  | 'linkedin'
  | 'whatsapp';

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export type LeadSource =
  | 'cold_outreach'
  | 'inbound'
  | 'referral'
  | 'linkedin'
  | 'website'
  | 'event'
  | 'other';

// Database Tables

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  website: string | null;
  phone: string | null;
  pipeline_stage: PipelineStage;
  priority: Priority;
  lead_source: LeadSource;
  assigned_to: string | null;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  prospect_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  prospect_id: string;
  contact_id: string | null;
  user_id: string;
  type: ActivityType;
  notes: string | null;
  attachments: ActivityAttachment[] | null;
  created_at: string;
}

export interface ActivityAttachment {
  name: string;
  url: string;
  size: number;
}

export interface Offer {
  id: string;
  prospect_id: string;
  product_type: string;
  amount: string; // Decimal as string
  discount_percentage: string; // Decimal as string
  contract_length_months: number;
  mrr: string; // Decimal as string
  arr: string; // Decimal as string
  status: OfferStatus;
  pdf_link: string | null;
  sent_date: string | null;
  response_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ProspectTag {
  prospect_id: string;
  tag_id: string;
  created_at: string;
}

// Insert types (for creating new records)
export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type NewProspect = Omit<Prospect, 'id' | 'created_at' | 'updated_at'>;
export type NewContact = Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
export type NewActivity = Omit<Activity, 'id' | 'created_at'>;
export type NewOffer = Omit<Offer, 'id' | 'created_at' | 'updated_at'>;
export type NewTag = Omit<Tag, 'id' | 'created_at'>;
export type NewProspectTag = Omit<ProspectTag, 'created_at'>;

// Update types (for updating records, all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateProspect = Partial<Omit<Prospect, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateContact = Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateOffer = Partial<Omit<Offer, 'id' | 'created_at' | 'updated_at'>>;

// Extended types with relationships
export interface ProspectWithRelations extends Prospect {
  assigned_user?: User;
  contacts?: Contact[];
  activities?: Activity[];
  offers?: Offer[];
  tags?: Tag[];
}

export interface ActivityWithRelations extends Activity {
  prospect: Prospect;
  contact?: Contact;
  user: User;
}

export interface OfferWithRelations extends Offer {
  prospect: Prospect;
}
