// ─── Base entity types ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

export type ContactEstado =
  | "nuevo"
  | "contactado"
  | "visito"
  | "negociacion"
  | "cerrado"
  | "perdido";

export type ContactInteres =
  | "compra"
  | "venta"
  | "alquiler"
  | "alquiler_temporal"
  | "inversion";

export type BudgetCurrency = "ARS" | "USD";

export type ContactOrigen =
  | "web"
  | "referido"
  | "redes_sociales"
  | "portal_inmobiliario"
  | "llamada_directa"
  | "otro";

export type ContactType =
  | "lead"
  | "propietario"
  | "inquilino"
  | "garante"
  | "otro";

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  dni: string | null;
  cuil: string | null;
  birth_date: string | null;
  occupation: string | null;
  estimated_income: number | null;
  estado: ContactEstado | null;
  interes: ContactInteres | null;
  contact_type: ContactType | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: BudgetCurrency | null;
  origen: ContactOrigen | null;
  notas: string | null;
  // Bank / payout info (propietario, inquilino)
  banco: string | null;
  cbu: string | null;
  alias_cbu: string | null;
  tipo_cuenta: string | null;
  // Garante-only
  recibos_sueldo_urls: string[] | null;
  assigned_to: string | null;
  company_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DealTipo =
  | "venta"
  | "alquiler"
  | "alquiler_temporal"
  | "inversion";

export type DealEstado =
  | "activo"
  | "ganado"
  | "perdido"
  | "pausado";

export interface Deal {
  id: string;
  title: string;
  contact_id: string | null;
  company_id: string | null;
  stage_id: string;
  value: number | null;
  currency: BudgetCurrency | null;
  tipo: DealTipo | null;
  estado: DealEstado | null;
  close_date: string | null;
  description: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityKind =
  | "nota"
  | "llamada"
  | "email"
  | "visita"
  | "reunion"
  | "whatsapp"
  | "otro";

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string | null;
  contact_id: string | null;
  deal_id: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export type PropertyTipo =
  | "casa"
  | "departamento"
  | "local"
  | "oficina"
  | "terreno"
  | "galpon"
  | "campo"
  | "otro";

export type PropertyEstado =
  | "disponible"
  | "reservado"
  | "vendido"
  | "alquilado"
  | "no_disponible";

export type PropertyOperacion = "venta" | "alquiler";

export interface Property {
  id: string;
  code: string | null;
  title: string;
  tipo: PropertyTipo | null;
  estado: PropertyEstado | null;
  operacion: PropertyOperacion | null;
  address: string | null;
  barrio: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  floor_unit: string | null;
  price_ars: number | null;
  price_usd: number | null;
  expensas: number | null;
  sup_cubierta: number | null;
  sup_descubierta: number | null;
  ambientes: number | null;
  dormitorios: number | null;
  banos: number | null;
  cocheras: number | null;
  antiguedad: number | null;
  orientacion: string | null;
  descripcion: string | null;
  img_urls: string[] | null;
  video_urls: string[] | null;
  amenities: string[] | null;
  pago_dia: number | null;
  deal_id: string | null;
  owner_contact_id: string | null;
  tenant_contact_id: string | null;
  // Documents
  contract_pdf_url: string | null;
  escritura_url: string | null;
  escritura_matricula: string | null;
  informe_dominio_url: string | null;
  // Tax / utilities
  dgr_cuenta: string | null;
  nomenclatura_catastral: string | null;
  municipalidad_cuenta: string | null;
  agua_unidad_facturacion: string | null;
  luz_n_cliente: string | null;
  luz_n_contrato: string | null;
  gas_n_cuenta: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyGarante {
  property_id: string;
  contact_id: string;
  vinculo: string | null;
  created_at: string;
}

export type TaskKind =
  | "llamada"
  | "visita"
  | "reunion"
  | "documentacion"
  | "seguimiento"
  | "otro";

export interface Task {
  id: string;
  title: string;
  kind: TaskKind | null;
  scheduled_at: string | null;
  completed_at: string | null;
  contact_id: string | null;
  deal_id: string | null;
  property_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Relation types ──────────────────────────────────────────────────────────

export interface ContactWithRelations extends Contact {
  company: Company | null;
  assigned_profile: Profile | null;
}

export interface DealWithRelations extends Deal {
  contact: Contact | null;
  company: Company | null;
  stage: PipelineStage | null;
  assigned_profile: Profile | null;
}

export interface PropertyWithRelations extends Property {
  owner: Contact | null;
  tenant: Contact | null;
  deal: Deal | null;
  garantes: Contact[];
}

export interface ActivityWithRelations extends Activity {
  contact: Contact | null;
  deal: Deal | null;
  created_by_profile: Profile | null;
}

export interface TaskWithRelations extends Task {
  contact: Contact | null;
  deal: Deal | null;
  property: Property | null;
  assigned_profile: Profile | null;
}

export interface CompanyWithCount extends Company {
  contacts_count: number;
}

// ─── Dashboard KPI types ─────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalContacts: number;
  activeDealsValue: number;
  tasksDueToday: number;
  contractsExpiring90: number;
}

// ─── Kanban types ────────────────────────────────────────────────────────────

export interface KanbanColumn {
  stage: PipelineStage;
  deals: DealWithRelations[];
  totalValue: number;
}
