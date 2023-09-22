import { DocumentData, Timestamp } from 'firebase/firestore';
import { HttpsCallableResult } from 'firebase/functions';
import numeral from 'numeral';
import { ReactNode } from 'react';
import { z } from 'zod';

export type Claim = 'admin' | 'superAdmin' | 'manager' | 'tinnumber' | 'branch';
export type UserClaims = {
  [K in Claim]?: boolean | string;
};

export interface GenericFields {
  path: { [k: string]: string };
  createdTime: Timestamp;
  updatedTime: Timestamp;
  _cref?: string;
  uids?: string[];
}

export type Permission = {
  id?: string;
  name: string;
};

export interface Role {
  name: string;
  description: string;
  permissions: string[];
}

export interface Item {
  id?: string;
  name: string;
  taxCode: 'A' | 'B' | 'C' | 'D';
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

export type RefineCallback<T extends z.ZodObject<any> = z.ZodObject<any>> = (
  data: z.infer<T>
) => boolean;

export type PropsWithPartialInstace<
  T = unknown,
  P extends DocumentData = DocumentData
> = T & {
  instance?: P;
};

export type PropsWithInstace<
  T = unknown,
  P extends DocumentData = DocumentData
> = T & {
  instance: P;
};

export type TabLink = {
  name: string;
  href: string;
  claims?: UserClaims;
  icon?: ReactNode;
};

export enum CommonExpenses {
  Electricity = 'Electricity',
  Rent = 'Rent',
  Utilities = 'Utilities',
  Salaries = 'Salaries',
  Benefits = 'Benefits',
  OfficeSupplies = 'Office Supplies',
  Equipment = 'Equipment',
  Maintenance = 'Maintenance',
  Marketing = 'Marketing',
  Travel = 'Travel',
  Insurance = 'Insurance',
  Taxes = 'Taxes',
  LegalServices = 'Legal Services',
  ProfessionalFees = 'Professional Fees',
  ITServices = 'IT Services',
  Training = 'Training',
  Depreciation = 'Depreciation',
  ResearchAndDevelopment = 'Research & Development',
  Advertising = 'Advertising',
  Telecommunications = 'Telecommunications',
  Printing = 'Printing',
  EmployeeMeals = 'Employee Meals',
  Entertainment = 'Entertainment',
  LicensesAndPermits = 'Licenses & Permits',
  RentEquipment = 'Rent Equipment',
  Shipping = 'Shipping',
  Repairs = 'Repairs',
  OfficeMaintenance = 'Office Maintenance',
  InternetServices = 'Internet Services',
  SoftwareSubscriptions = 'Software Subscriptions',
  OfficeFurniture = 'Office Furniture',
  ConferencesAndEvents = 'Conferences & Events',
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

export type Branch = {
  name: string;
  id: string;
  company?: string;
  totalPurchases: number;
  isMain?: boolean;
  totalSales: number;
  path: { [k: string]: string };
};

export type CreateFormProps<T extends DocumentData = DocumentData> = {
  instance?: T;
};

export type RemoteConfirmTransfer = {
  receiverBranch: string;
  branch: string;
  cartDoc: string;
};

export type SalesCart = {
  orderItems: OrderItem[];
  customer?: Customer;
  orderItemsCost: number;
  payInfo: PayInfo;
};

export type RemoteConfirm = {
  customerDoc: string;
  cartDoc: string;
};

export type FilterNonMethods<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export type SalesState = {
  isTransfer: boolean;
  customerEmpties: number;
  setCustomerEmpties: React.Dispatch<React.SetStateAction<number>>,
  orderItems: OrderItem[];
  willPayCaution: boolean;
  setWillPayCaution: React.Dispatch<React.SetStateAction<boolean>>,
  customer?: Customer;
  branch?: Branch;
  totalTax: number;
  checkBranchFillables: () => Promise<[boolean, string | undefined]>;
  costAfterDiscount: number;
  totalQuantity: number;
  checkCustomerFillables: () => Promise<[boolean, string | undefined]>;
  payInfo: PayInfo;
  orderItemsCost: number;
  status: 'loading' | 'error' | 'success';
  handleSaveSalesCart: () => void;
  handleClearCart: () => void;
  changeBranch: (branch?: Branch) => void;
  changeCustomer: (newCustomer?: Customer) => void;
  addOrderItem: (orderItem: OrderItem) => void;
  replaceOrderItem: (prevOrderItem: OrderItem, orderItem: OrderItem) => void;
  removeOrderItem: (orderItem: OrderItem) => void;
  changePayInfo: (payInfo: PayInfo) => void;
  handleConfirmTransfer(): Promise<HttpsCallableResult<unknown> | undefined>;
  handleConfirmSale(): Promise<HttpsCallableResult<unknown> | undefined>;
};

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
  unprocessed: number;
  totalDebit: number;
  totalCredit: number;
  address: string;
};

export type financeType = 'IN' | 'OUT';

export type CustomerFinancesType = {
  readonly id: string;
  path: { [k: string]: string };
  type: financeType;
  amount: number;
  transDate: Date;
};

export interface Purchase {
  id: string;
  item: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  taxAmount: number;
  total: number;
  itemName: string;
  nonTaxableAmount: number;
  taxCode: 'A' | 'B' | 'C' | 'D';
}

export type Mutable<T> = {
  -readonly [k in keyof T]: T[k];
};

export interface Invoice {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  supplierName?: string;
  supplierBranch?: string;
  purchaseDate: Date;
  totalQuantity: number;
  shipmentDate: Date;
  supplierSDCId: string;
  saved: boolean;
  canceled?: boolean;
  prevCount?: number;
  prevId?: string;
  prevOrderNumber?: string;
  paidAmount: number;
  totalCost: number;
  paymentDate: Date;
  totalItemCount: number;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  supplier: string;
  paymentMethod: 'CASH' | 'BANK' | 'CREDIT' | 'CARD' | 'OTHER';
  confirmed: boolean;
  path: { [k: string]: string };
  createdTime: Timestamp;
  // items: Record<string, number>;
  // payment: Payment;
}

export interface Supplier {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  SDCIds: { sdcId: string }[];
  // purchases?: Record<string, Purchase>;
  // payments: Record<string, Payment>;
}

export enum ItemRejectReason {
  Damaged = 'Damaged',
  Mismatch = 'Mismatch',
  OverStock = 'Over Stock',
  Other = 'Other',
}

export enum InventoryAction {
  Accept = 'Accept',
  Restock = 'Restock',
  Sell = 'Sell',
  Purchase = 'Purchase',
  Transfer = 'Transfer',
  Normal = 'Normal',
}

export type Grant = {
  id: string;
  supplier: string;
  supplierName: string;
  supplierBranch: string;
  totalAmount: number;
  balance: number;
  creditAmount: number;
  alertAmount: number;
};

export type GrantTrans = {
  id: string;
  amount: number;
  type: 'IN' | 'OUT';
  transDate: Date;
  order: string;
  bank: string;
  bankUsed: string;
  orderNumber: string;
};

export interface Inventory {
  readonly id: string;
  item: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  branch: string;
  company: string;
  nonTaxableAmount: number;
  taxCode: 'A' | 'B' | 'C' | 'D';
  unAllocated: number;
  readonly path: { [k: string]: any };
  locations?: Array<{ path: string; quantity: number }>;
  lastAction: InventoryAction;
  lastChange: number;
  lastTax: number;
}

export type InventoryItem = Inventory;

export type InvoiceInfo = {
  total: number;
  items: { name: string; unitPrice: number; quantity: number; total: number }[];
  orderCount: number;
  companyName: string;
  customerName: string;
  itemCount: number;
  date: string;
  employeeName: string;
};

export type SwitchInfo = {
  branch?: string;
  company?: string;
};

export interface Location {
  name: string;
  branchId: string;
  branchName: string;
  company: string;
  capacity: number;
  quantity: number;
}

export type OrderStatus = {
  Cart: 'CART';
  Pending: 'PENDING';
  Returned: 'RETURNED';
  Canceled: 'CENCELED';
  Completed: 'COMPLETED';
};

export type PayInfo = {
  payMethod: string;
  payAmount: number;
  payDate: string | Date | null;
  discount: number;
};

export type OrderItem = {
  id: string;
  item: string;
  itemName: string;
  unitPrice: number;
  taxCode: 'A' | 'B' | 'C' | 'D';
  taxAmount: number;
  quantity: number;
  totalPrice: number;
  nonTaxableAmount: number;
  totalAfterDiscount: number;
  discount: number;
};

export type TransferItemReject = {
  qty: number;
  reason: string;
  desc: string;
  restocked?: boolean;
};

export type TransferItem = {
  id: string;
  item: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  taxAmount: number;
  taxCode: 'A' | 'B' | 'C' | 'D';
  totalPrice: number;
  totalAfterDiscount: number;
  discount: number;
  nonTaxableAmount: number;
  acceptedQty?: number;
  rejected?: TransferItemReject[];
  totRejected?: number;
  isRejected?: boolean;
  untouchedQty?: number;
  isAccepted?: boolean;
};

export type OrderPayment = {
  payMethod: string;
  paidAmount: number;
  creditAmount: number;
};

export type DeliveryStatus = {
  Notstarted: 'UNSTARTED';
  Ongoing: 'ONGOING';
  Onhold: 'ONHOLD';
  Canceled: 'CANCELED';
  Completed: 'COMPLETED';
};

export type Order = {
  readonly id?: string;
  payMethod: string;
  totalCost: number;
  totalTax: number;
  costAfterDiscount: number;
  discount: number;
  credit: number;
  payDate: Date | string | null;
  totalQuantity: number;
  orderCount: number;
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

// export type Order = {
//   id: string;
//   date: string;
//   status: OrderStatus;
//   items: Record<string, number>;
//   delivery: {
//     address?: string;
//     startedAt: Date | string;
//     date: Date | string;
//     status: DeliveryStatus;
//   };
// };

export type BranchFillable = {
  name: string;
  id: string;
  path: { [k: string]: string };
  totalTaken: number;
  totalReturned: number;
  emptiesBalance: number;
};

export type ItemEmpties = GenericFields & {
  itemName: string;
  totalTaken: number;
  available: number;
  totalReturned: number;
};

export type EmptiesReturn = {
  item: string;
  itemName: string;
  createdTime?: Timestamp;
  updatedTime?: Timestamp;
  dateReturned: Date;
  returnedQty: number;
};

export type SupplierEmptiesReturn = {
  id: string;
  item: string;
  itemName: string;
  returnedQty: number;
  dateReturned: Date;
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

export interface Allocation {
  item: string;
  itemName: string;
  branchId: string;
  branchName: string;
  company: string;
  capacity: number;
  quantity: number;
}

export interface WareHouse extends Location {}
export interface Area extends WareHouse {
  warehouseId: string;
  warehouseName: string;
}
export interface Row {
  name: string;
  warehouseId: string;
  areaId: string;
  capacity: number;
  quantity: number;
}
export interface WareHouse {
  name: string;
  capacity: number;
  quantity: number;
}

export type Transfer = Omit<Order, 'customer' | 'items' | 'customerName'> & {
  transferType: 'IN' | 'OUT';
  id: string;
  from: string;
  fromBranch: string;
  to: string;
  toBranch: string;
  items: TransferItem[];
  doneItems: number;
  theirTransfer: string;
};

// interface Company {
//   name: string;
//   tinnumber: string | number;
//   branches: Record<string, Branch>;
// }

// interface Branch {
//   name: string;
//   address: string;
//   roles: Record<string, Role>;
//   users: Record<string, User>;
//   inventory: Record<string, Product>;
//   customers: Record<string, Customer>;
//   suppliers: Record<string, Supplier>;
//   damaged_products: Record<string, DamagedProduct>;
//   returned_products: Record<string, ReturnedProduct>;
// }

// interface User {
//   name: string;
//   email: string;
//   role_id: string;
//   branch_id: string;
// }

// interface Product {
//   name: string;
//   description: string;
//   price: number;
//   quantity: number;
//   location: Location;
// }

// interface Customer {
//   name: string;
//   email: string;
//   phone: string;
//   address: string;
//   orders: Record<string, Order>;
//   payments: Record<string, Payment>;
// }

// interface DamagedProduct {
//   name: string;
//   description: string;
//   quantity: number;
//   location: Location;
// }

// interface ReturnedProduct {
//   name: string;
//   description: string;
//   quantity: number;
//   reason: string;
//   location: Location;
// }

// interface Order {
//   date: string;
//   status: string;
//   items: Record<string, number>;
//   delivery: {
//     date: string;
//     status: string;
//   };
// }

// interface Payment {
//   date: string;
//   amount: number;
//   method: string;
// }

// interface Purchase {
//   date: string;
//   status: string;
//   items: Record<string, number>;
//   payment: Payment;
// }

// interface Location {
//   warehouse: string;
//   area: string;
//   row: number;
//   bay: number;
//   level: number;
//   position: number;
// }

// // type CollectionPath<T> = string & { __collectionPath: T };
// type CompanyID = string & {__brand: "companyID"};
// type BranchID = string & {__brand: "branchID"};
// type RoleID = string & {__brand: "roleID"};
// type UserID = string & {__brand: "userID"};
// type ProductID = string & {__brand: "productID"};
// type CustomerID = string & {__brand: "customerID"};
// type OrderID = string & {__brand: "orderID"};
// type PaymentID = string & {__brand: "paymentID"};
// type PurchaseID = string & {__brand: "purchaseID"};
