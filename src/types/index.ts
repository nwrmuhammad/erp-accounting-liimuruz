// ─── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleType: 'SUPER_ADMIN' | 'BOSS' | 'EMPLOYEE';
  permissions: string[];
  branch: Branch | null;
  lastLoginAt: string | null;
  createdAt: string;
}

// ─── Products ──────────────────────────────────────────────────────────────────
export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  branchId: string;
  branchName: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
  category: ProductCategory | null;
  branchId: string;
  branchName: string;
  createdAt: string;
}

// ─── Sales ─────────────────────────────────────────────────────────────────────
export type PaymentType = 'CASH_UZS' | 'CASH_USD' | 'ONLINE';
export type OnlineReceiver = 'ALI' | 'BILOL' | 'JAMOL' | 'ABDULBOSIT';

export type SaleStatus = 'OCHIQ' | 'YOPILDI' | 'POCHTADA';

export interface Sale {
  id: string;
  saleNumber: string;
  branchId: string;
  branchName: string;
  createdByName: string;
  productName: string | null;
  quantity: number | null;
  totalAmount: number;
  currency: CurrencyType;
  paymentType: PaymentType;
  onlineReceiver: OnlineReceiver | null;
  saleDate: string;
  status: SaleStatus;
  puliOlindi: boolean;
  notes: string | null;
  createdAt: string;
}


// ─── Inventory ─────────────────────────────────────────────────────────────────
export type InventoryMovementType = 'INCOMING' | 'OUTGOING';

export interface InventoryMovement {
  id: string;
  type: InventoryMovementType;
  quantity: number;
  note: string | null;
  productId: string;
  productName: string;
  productSku: string;
  branchName: string;
  createdByName: string;
  createdAt: string;
}

export interface StockSummary {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  currentStock: number;
  totalIncoming: number;
  totalOutgoing: number;
  branchName: string;
}

// ─── Expenses ──────────────────────────────────────────────────────────────────
export type CurrencyType = 'UZS' | 'USD';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: CurrencyType;
  exchangeRate: number | null;
  paymentType: PaymentType;
  onlineReceiver: OnlineReceiver | null;
  expenseDate: string;
  branchId: string;
  branchName: string;
  paidByName: string;
  notes: string | null;
  createdAt: string;
}

// ─── Analytics ─────────────────────────────────────────────────────────────────
export interface SalesSummary {
  totalCashUzs: number;
  totalCashUsd: number;
  totalOnline: number;
  totalAli: number;
  totalBilol: number;
  totalSales: number;
  salesCount: number;
}


export interface InventoryTrend {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface ExpenseTrend {
  totalUzs: number;
  totalUsd: number;
  count: number;
}

export interface Analytics {
  sales: SalesSummary;
  inventoryTrends: InventoryTrend[];
  expenseTrends: ExpenseTrend[];
  period: { from: string; to: string };
}

// ─── Forms ─────────────────────────────────────────────────────────────────────
export interface CreateProductCategoryDto {
  name: string;
  description?: string;
  branchId?: string;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock?: number;
  categoryId?: string;
  isActive?: boolean;
  branchId?: string;
}

export interface CreateSaleDto {
  productName?: string;
  quantity?: number;
  totalAmount: number;
  currency?: CurrencyType;
  paymentType: PaymentType;
  onlineReceiver?: OnlineReceiver;
  saleDate?: string;
  status?: SaleStatus;
  notes?: string;
  branchId?: string;
}


export interface CreateInventoryMovementDto {
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  note?: string;
  branchId?: string;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  currency: CurrencyType;
  paymentType: PaymentType;
  onlineReceiver?: OnlineReceiver;
  notes?: string;
  expenseDate?: string;
  branchId?: string;
}
