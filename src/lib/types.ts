export type JobStatus =
  | "Lead"
  | "Work Order"
  | "En Route"
  | "Working"
  | "Job Done"
  | "Final Invoice"
  | "Payment"
  | "Review"
  // Legacy statuses (mapped on read)
  | "New"
  | "Scheduled"
  | "On Scene"
  | "Complete"
  | "Invoiced"
  | "Paid"
  | "Called"
  | "In Progress"
  | "Completed";
export type ServiceType = "HVAC" | "Appliance Repair" | "Commercial Kitchen" | "Handyman" | "Other";
export type EquipmentType = "HVAC" | "Appliance" | "Commercial Kitchen" | "Handyman" | "Warranty";
export type UserRole = "admin" | "technician" | "it" | "customer";

export interface Job {
  id: string;
  jobNumber: string;          // YYYY-XXXX auto-generated
  createdAt: string;          // ISO timestamp
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: ServiceType | string;
  problemDescription: string;
  address?: string;
  scheduledAt?: string;       // ISO timestamp
  status: JobStatus;
  notes?: string;
  trackingToken: string;      // for /track/[token] public page
  googleReviewSent: boolean;
  sheetsSynced: boolean;
  leadSource?: string;
  // v2 fields
  equipmentType?: EquipmentType | string;
  modelNumber?: string;
  aiSuggestions?: string;     // cached JSON from AI diagnostic
  warrantyFlag?: boolean;
  subscriptionFlag?: boolean;
  warrantyAuthNumber?: string;
  warrantyContact?: string;
  warrantyCovered?: string;   // 'covered' | 'not_covered' | ''
  warrantyReimbursement?: number;
  warrantyWorkOrderNumber?: string;
  warrantyAuthStatus?: string;  // 'pending' | 'approved' | 'denied' | 'reassigned'
  warrantyBillingEntity?: string;
  warrantyInvoiceStatus?: string; // 'not_submitted' | 'submitted' | 'approved' | 'paid' | 'disputed'
  deductibleCollected?: boolean;
  deductibleAmount?: number;
  assignedTo?: string;        // 'joe' | 'anthoney'
  followUpRequired?: boolean;
  followUpNotes?: string;
  needsAiSuggestions?: boolean;
  // Google Calendar sync
  googleCalendarEventId?: string;
  googleCalendarSyncedAt?: string;
  // Invoice delivery tracking
  invoiceSentAt?: string;   // ISO timestamp when invoice was last emailed
  receiptSentAt?: string;   // ISO timestamp when receipt was last emailed
  invoiceSentTo?: string;   // Email address the invoice/receipt was sent to
  // Legacy fields for backward compatibility
  date?: string;
  phone?: string;
  amount?: number;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  planType: "residential" | "commercial";
  recurrence: string;         // JSON: { type, value }
  startDate: string;
  nextDue: string;
  status: "active" | "paused" | "cancelled";
  notes?: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  jobId?: string;
  recipient: "joe" | "anthoney" | "customer";
  type: "toast" | "email";
  event: string;
  sentAt: string;
  status: "sent" | "failed";
}

export interface JobItem {
  id: string;
  jobId: string;
  itemType: "Part" | "Labor" | "Diagnostic Fee" | "Other";
  description: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  qtyOnHand: number;
  reorderPoint: number;
  unitCost: number;
  retailPrice: number;
  supplier?: string;
  updatedAt: string;
  // Legacy
  partName?: string;
  qty?: number;
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId?: string;
  createdAt: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  paidAt?: string;
  notes?: string;
  items?: InvoiceLineItem[];
  // Legacy
  amount?: number;
  date?: string;
  customer?: string;
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface PriceListItem {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  itemType: "Labor" | "Part" | "Fee";
  // Legacy
  price?: number;
  category?: string;
}

export type SocialPost = {
  id: string;
  post_type: string;
  context_notes?: string;
  generated_content?: string;
  scheduled_at?: string;
  status: string;
  revision_notes?: string;
  fb_post_id?: string;
  fb_post_url?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
};

export interface ServiceLogEntry {
  id: string;
  dateTime: string;
  customer: string;
  address: string;
  equipmentType: string;
  problem: string;
  partsUsed: string;
  timeSpent: string;
  outcome: string;
}
