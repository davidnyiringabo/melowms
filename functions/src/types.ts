import { Timestamp } from "firebase-admin/firestore";
import { ExportStats } from "./statsTree";

export interface GenericFields {
  path: { [k: string]: string };
  createdTime: Timestamp;
  updatedTime: Timestamp;
  _cref?: string;
  uids?: string[];
}

export type StatsType = GenericFields & {
  stats: ExportStats;
};

export type ItemEmpties = GenericFields & {
  itemName: string;
  totalTaken: number;
  available: number;
  totalReturned: number;
};

export type NewUser = {
  email: string;
  phoneNumber?: string;
  password: string;
  displayName: string;
  emailVerified?: boolean;
};

export type Company = {
  name: string;
  tinnumber: number;
};

export type Grant = {
  id: string;
  supplier: string;
  totalAmount: number;
  balance: number;
  creditAmount: number;
  alertAmount: number;
};

export type GrantTrans = GenericFields & {
  id: string;
  order: string;
  orderNumber: string;
  orderBranch: string;
  bankUsed: string;
  bankAccount?: string;
  amount: number;
  type: "IN" | "OUT";
  transDate: Date;
};

export type financeType = "IN" | "OUT";

export type CustomerFinancesType = GenericFields & {
  readonly id: string;
  type: financeType;
  amount: number;
  transDate: Date;
};

export type OrderStatus =
  | "CART"
  | "PENDING"
  | "RETURNED"
  | "CENCELED"
  | "COMPLETED";

export type Customer = {
  path: { [k: string]: string };
  id: string;
  name: string;
  email: string;
  phone: string;
  tinnumber: string;
  totalTaken: number;
  totalReturned: number;
  emptiesBalance: number;
  defaultDiscount: number;
  totalDebit: number;
  totalCredit: number;
  address: string;
};

export type OrderItem = {
  id: string;
  item: string;
  itemName: string;
  unitPrice: number;
  taxCode: "A" | "B" | "C" | "D";
  taxAmount: number;
  quantity: number;
  totalPrice: number;
  totalAfterDiscount: number;
  discount: number;
};

export type PayInfo = {
  empties: number;
  caution: number;
  payMethod: string;
  payAmount: number;
  payDate: string | Date | null;
  discount: number;
};

export type SalesState = {
  orderItems: OrderItem[];
  customer?: Customer;
  costAfterDiscount: number;
  totalTax: number;
  totalQuantity: number;
  checkCustomerFillables: () => Promise<[boolean, string | undefined]>;
  payInfo: PayInfo;
  orderItemsCost: number;
  status: "loading" | "error" | "success";
  handleSaveSalesCart: () => void;
  changeCustomer: (newCustomer?: Customer) => void;
  addOrderItem: (orderItem: OrderItem) => void;
  replaceOrderItem: (prevOrderItem: OrderItem, orderItem: OrderItem) => void;
  removeOrderItem: (orderItem: OrderItem) => void;
  changePayInfo: (payInfo: PayInfo) => void;
};

export type DeliveryStatus =
  | "UNSTARTED"
  | "ONGOING"
  | "ONHOLD"
  | "CANCELED"
  | "COMPLETED";

export type Order = {
  readonly id?: string;
  payMethod: string;
  empties: number;
  caution: number;
  totalCost: number;
  costAfterDiscount: number;
  discount: number;
  totalTax: number;
  credit: number;
  payDate: Date | string | null;
  totalQuantity: number;
  customer: string;
  customerName: string;
  totalItems: number;
  status: OrderStatus;
  items: OrderItem[];
  createdTime: any;
  updatedTime: any;
  uids: [string];
  delivery: {
    address?: string;
    startedAt: Date | string;
    date: Date | string;
    status: DeliveryStatus;
  };
  path: { [k: string]: string };
};

export type Transfer = Omit<Order, "customer" | "customerName"> & {
  transferType: "IN" | "OUT";
  from: string;
  fromBranch: string;
  to: string;
  toBranch: string;
  theirTransfer: string;
  doneItems: number;
};

export enum FillableType {
  OUT = "OUT",
  IN = "IN",
}

export enum CommonExpenses {
  Electricity = "Electricity",
  Rent = "Rent",
  Utilities = "Utilities",
  Salaries = "Salaries",
  Benefits = "Benefits",
  OfficeSupplies = "Office Supplies",
  Equipment = "Equipment",
  Maintenance = "Maintenance",
  Marketing = "Marketing",
  Travel = "Travel",
  Insurance = "Insurance",
  Taxes = "Taxes",
  LegalServices = "Legal Services",
  ProfessionalFees = "Professional Fees",
  ITServices = "IT Services",
  Training = "Training",
  Depreciation = "Depreciation",
  ResearchAndDevelopment = "Research & Development",
  Advertising = "Advertising",
  Telecommunications = "Telecommunications",
  Printing = "Printing",
  EmployeeMeals = "Employee Meals",
  Entertainment = "Entertainment",
  LicensesAndPermits = "Licenses & Permits",
  RentEquipment = "Rent Equipment",
  Shipping = "Shipping",
  Repairs = "Repairs",
  OfficeMaintenance = "Office Maintenance",
  InternetServices = "Internet Services",
  SoftwareSubscriptions = "Software Subscriptions",
  OfficeFurniture = "Office Furniture",
  ConferencesAndEvents = "Conferences & Events",
}

export type Expense = Partial<GenericFields> & {
  readonly id: string;
  category: CommonExpenses;
  amount: number;
  paymentDate: Date;
  approved: boolean;
  description: string;
  approvedBy: string;
  approvedByName: string;
  doneBy: string;
  doneByName: string;
  approvedAt?: Timestamp;
  receipt: string;
};

export type Fillable = {
  path: { [k: string]: string };
  id: string;
  item: string;
  itemName: string;
  unitPrice: number;
  totalTaken: number;
  totalReturned: number;
  createdTime: Timestamp;
  updatedTime: Timestamp;
  remaining: number;
};

export type SupplierEmptiesReturn = GenericFields & {
  item: string;
  itemName: string;
  returnedQty: number;
  dateReturned: Date;
};

export type EmptiesReturn = {
  item: string;
  itemName: string;
  createdTime: Timestamp;
  updatedTime: Timestamp;
  dateReturned: Timestamp;
  returnedQuantity: number;
};

export type BranchFillable = {
  name: string;
  id: string;
  path: { [k: string]: string };
  totalTaken: number;
  totalReturned: number;
  emptiesBalance: number;
};

export type RemoteConfirm = {
  customerDoc: string;
  cartDoc: string;
};
export type RemoteConfirmTransfer = {
  receiverBranch: string;
  branch: string;
  cartDoc: string;
};

export enum InventoryAction {
  Accept = "Accept",
  Restock = "Restock",
  Sell = "Sell",
  Purchase = "Purchase",
  Transfer = "Transfer",
  Normal = "Normal",
}

export type Branch = {
  name: string;
  id: string;
  company?: string;
  totalSales: number;
  totalPurchases: number;
  path: { [k: string]: string };
};

export interface Purchase {
  id: string;
  items: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  taxAmount: number;
  total: number;
  itemName: string;
  nonTaxableAmount: number;
  confirmed?: boolean;
  taxCode: "A" | "B" | "C" | "D";
  path: { [k: string]: string };
}

export interface Invoice {
  orderNumber: string;
  paidAmount: number;
  invoiceNumber: string;
  totalCost: number;
  paymentDate: Date;
  totalItemCount: number;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  supplier: string;
  paymentMethod: "CASH" | "BANK" | "CREDIT" | "CARD" | "OTHER";
  confirmed: boolean;
  path: { [k: string]: string };
  supplierName?: string;
  supplierBranch?: string;
  purchaseDate: Date;
  totalQuantity: number;
  saved: boolean;
  canceled?: boolean;
  prevCount?: number;
  prevId?: string;
  prevOrderNumber?: string;
  // items: Record<string, number>;
  // payment: Payment;
}

export interface Inventory {
  readonly id: string;
  item: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  branch: string;
  company: string;
  nonTaxableAmount: number;
  taxCode: "A" | "B" | "C" | "D";
  unAllocated: number;
  readonly path: { [k: string]: any };
  locations?: Array<{ path: string; quantity: number }>;
  lastAction: InventoryAction;
  lastChange: number;
  lastTax: number;
}

export interface Item {
  id?: string;
  name: string;
  taxCode: "A" | "B" | "C" | "D";
  itemClass: string;
  countryOfOrigin: string;
  itemType: string;
  packageUnit: string;
  purchaseUnitPrice: number;
  sellingUnitPrice: number;
  nonTaxableAmount: number;
  packageCapacity: number;
  quantityUnit: number;
  insuranceApplicable: boolean;
}

export enum CollectionName {
  Allocations = "allocations",
  Locations = "locations",
  Invoices = "invoices",
  Admins = "admins",
  Items = "items",
  Companies = "companies",
  Branches = "branches",
  Permissions = "permissions",
  Roles = "roles",
  Users = "users",
  SalesCart = "sales_cart",
  Inventory = "inventory",
  Customers = "customers",
  Orders = "orders",
  CustomerEmpties = "customer_empties",
  Payments = "payments",
  Suppliers = "suppliers",
  Purchases = "purchases",
  DamagedProducts = "damaged_products",
  ReturnedProducts = "returned_products",
}
