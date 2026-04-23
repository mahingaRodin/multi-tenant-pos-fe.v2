// API DTOs mirrored from the backend OpenAPI spec.
export type Role =
  | "ROLE_SUPER_ADMIN"
  | "ROLE_STORE_ADMIN"
  | "ROLE_STORE_MANAGER"
  | "ROLE_BRANCH_MANAGER"
  | "ROLE_BRANCH_CASHIER"
  | "ROLE_CUSTOMER";

export type PaymentType = "CASH" | "UPI" | "CARD";

export interface UserDto {
  id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: Role;
  password?: string;
  branchId?: string;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface StoreDto {
  id?: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
  ownerId?: string;
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
  items: OrderItemDto[];
  paymentType: PaymentType;
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
  branchId?: string;
  cashierId?: string;
  paymentSummaries?: PaymentSummary[];
  recentOrders?: OrderDto[];
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
}
