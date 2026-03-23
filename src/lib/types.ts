export interface Job {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  serviceType: string;
  status: "Called" | "Scheduled" | "In Progress" | "Completed" | "Invoiced" | "Paid";
  amount: number;
  notes: string;
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: string;
  amount: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface InventoryItem {
  id: string;
  partName: string;
  partNumber: string;
  category: string;
  qty: number;
  reorderPoint: number;
  unitCost: number;
  supplier: string;
}

export interface PriceListItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}
