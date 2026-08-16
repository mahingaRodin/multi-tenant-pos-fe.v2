// API DTOs mirrored from the backend OpenAPI spec.
export type Role =
  | "ROLE_SUPER_ADMIN"
  | "ROLE_STORE_ADMIN"
  | "ROLE_STORE_MANAGER"
  | "ROLE_BRANCH_MANAGER"
  | "ROLE_BRANCH_CASHIER"
  | "ROLE_CUSTOMER";

export type PaymentType = "CASH" | "UPI" | "CARD";

export type EOrderStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";

export type EUserStatus = "ACTIVE" | "SUSPENDED" | "DISCHARGED" | "PENDING";

export interface UserDto {
  id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: Role;
  userStatus?: EUserStatus;
  password?: string;
  branchId?: string;
  storeId?: string;
  tenantId?: string;
  emailVerified?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export type EStoreStatus = "ACTIVE" | "PENDING" | "BLOCKED";
export type RawStoreStatus = EStoreStatus | 0 | 1 | 2;

const ORDINAL_STATUS: Record<number, EStoreStatus> = { 0: "ACTIVE", 1: "PENDING", 2: "BLOCKED" };
export function normalizeStoreStatus(raw?: RawStoreStatus): EStoreStatus | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number") return ORDINAL_STATUS[raw] ?? "ACTIVE";
  return raw as EStoreStatus;
}

export interface StoreContact {
  address?: string;
  phone?: string;
  email?: string;
}

export interface StoreDto {
  id?: string;
  brand: string;
  description?: string;
  storeType?: string;
  status?: RawStoreStatus;
  contact?: StoreContact;
  storeAdmin?: UserDto;
  createdAt?: string;
  updatedAt?: string;
}

/** Spring Page<T> wrapper */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AuthResponse {
  jwt: string;
  message?: string;
  user: UserDto;
}

export interface CategoryDto {
  id?: string;
  name: string;
  storeId?: string;
}

export interface ProductDto {
  id?: string;
  name: string;
  sku?: string;
  description?: string;
  mrp?: number;
  sellingPrice: number;
  brand?: string;
  image?: string;
  category?: CategoryDto;
  categoryId?: string;
  storeId?: string;
  storeName?: string;
  storeBrand?: string;
  categoryName?: string;
  stockQuantity?: number;
  favorite?: boolean;
}

export interface CustomerDto {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: Role;
}

export interface OrderItemDto {
  id?: string;
  quantity: number;
  price: number;
  productId: string;
  product?: ProductDto;
  orderId?: string;
}

export interface OrderDto {
  id?: string;
  totalAmount: number;
  createdAt?: string;
  branchId: string;
  customerId?: string;
  cashierId?: string;
  branchName?: string;
  storeBrand?: string;
  customerName?: string;
  items: OrderItemDto[];
  paymentType: PaymentType;
  status?: EOrderStatus;
}

export interface BranchDto {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  workingDays?: string[];
  openTime?: string;
  closeTime?: string;
  storeId?: string;
}

export interface InventoryDto {
  id?: string;
  branchId: string;
  productId: string;
  quantity: number;
  product?: ProductDto;
  lastUpdate?: string;
}

export interface PaymentSummary {
  type: PaymentType;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface ShiftReportDto {
  id?: string;
  shiftStart?: string;
  shiftEnd?: string;
  totalSales?: number;
  totalRefunds?: number;
  netSale?: number;
  totalOrders?: number;
  branch?: BranchDto;
  branchId?: string;
  cashier?: UserDto;
  cashierId?: string;
  paymentSummaries?: PaymentSummary[];
  topSellingProducts?: ProductDto[];
  recentOrders?: OrderDto[];
  refunds?: RefundDto[];
}

export interface RefundDto {
  id?: string;
  orderId: string;
  reason: string;
  amount: number;
  shiftReportId?: string;
  cashierName?: string;
  branchId?: string;
  paymentType: PaymentType;
  createdAt?: string;
  status?: string;
  restocked?: boolean;
}

export type ERegistrationStatus = "PENDING" | "UNDER_REVIEW" | "MORE_INFO" | "APPROVED" | "REJECTED";

export interface TenantRegistrationDto {
  id: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone?: string;
  businessName: string;
  legalName?: string;
  registrationNumber?: string;
  country?: string;
  industry?: string;
  businessDescription?: string;
  status: ERegistrationStatus;
  adminNotes?: string;
  rejectionReason?: string;
  moreInfoMessage?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  registrationId?: string;
  read: boolean;
  createdAt: string;
}

export interface DailyMetric {
  day: string;
  revenue: number;
  orders: number;
}

export interface NamedMetric {
  name: string;
  value: number;
}

export interface AnalyticsSummary {
  revenue: number;
  orderCount: number;
  storeCount: number;
  branchCount: number;
  productCount: number;
  employeeCount?: number;
  daily: DailyMetric[];
  byBranch: NamedMetric[];
  topProducts: NamedMetric[];
}
