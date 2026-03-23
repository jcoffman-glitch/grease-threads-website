export type JobStatus = "Lead" | "Called" | "Scheduled" | "In Progress" | "Completed" | "Invoiced" | "Paid";
export type ServiceType = "HVAC" | "Appliance Repair" | "Commercial Kitchen" | "Handyman" | "Other";

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
  // Legacy fields for backward compatibility
  date?: string;
  phone?: string;
  amount?: number;
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
