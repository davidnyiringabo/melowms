import { db, auth } from "../firebaseConfig";
import {
  collection as dbCollection,
  doc,
  setDoc,
  getDoc,
  DocumentSnapshot,
  DocumentData,
  Timestamp,
  deleteDoc,
  arrayUnion,
  getDocs,
  CollectionReference,
} from "firebase/firestore";

type NodeType = "document" | "collection";
class FirestoreNode {
  type: NodeType;
  path: string = "";
  _cref: string = "";

  constructor(type: NodeType, path: string = "") {
    this.type = type;
    this.path = path;
  }

  objectPath() {
    const path = this.path
      .split("/")
      .reduce<{ [k: string]: any }>((pre, curr, i, arr) => {
        if (i % 2 === 1) {
          pre[curr] = arr[i + 1];
        }
        return pre;
      }, {});
    return path;
  }

  arrayPath(): string[] {
    const arrayPath = this.path.split("/");
    arrayPath.shift();
    return arrayPath;
  }
  get ref(): object & { path: string } {
    return { path: "" };
  }
}

export enum CollectionName {
  Allocations = "allocations",
  Locations = "locations",
  Invoices = "invoices",
  Grants = "grants",
  Admins = "admins",
  BranchStats = "branch_stats",
  CompanyStats = "company_stats",
  Items = "items",
  Companies = "companies",
  CompanyBanks = "company_banks",
  Branches = "branches",
  Permissions = "permissions",
  Roles = "roles",
  DefaultRoles = "default_roles",
  Users = "users",
  GrantTransactions = "grant_transactions",
  SalesCart = "sales_cart",
  Transfers = "transfers",
  TransferCart = "transfer_cart",
  Inventory = "inventory",
  Customers = "customers",
  Orders = "orders",
  FillableGroups = "fillable_groups",
  BranchFillables = "branch_fillables",
  ItemsTaken = "items_taken",
  EmptiesReturns = "empties_returns",
  CustomerEmpties = "customer_empties",
  CustomerFinances = "customer_finances",
  Payments = "payments",
  Suppliers = "suppliers",
  Purchases = "purchases",
  DamagedProducts = "damaged_products",
  CheckedDamagedProducts = "checked_damaged_products",
  ReturnedProducts = "returned_products",
  BranchExpenses = "branch_expenses",
  EmptiesStock = "empties_stock",
  SupplierEmptiesReturns = "supplier_empties_returns",
  CheckedEmpties = "checked_empties",
  SortedEmpties = "sorted_empties",
  SortedCheckedEmpties = "sorted_checked_empties",
  Sells = "sells",
  SellsItems = "sells_items",
}

export class CollectionNode extends FirestoreNode {
  name: CollectionName;
  subCollections: CollectionNode[] = [];
  props: string[] = [];

  constructor({
    name,
    path = "",
    props = [],
  }: {
    name: CollectionName;
    path?: string;
    props?: string[];
  }) {
    super("collection");
    this.name = name;
    this.path = path + `/${name}`;
    this.props = props;
  }

  get ref() {
    return dbCollection(db, this.path);
  }

  addSubcollection(subCollection: CollectionNode): CollectionNode {
    this.subCollections.push(subCollection);
    return this;
  }

  async getDocs<
    T extends DocumentData & { id: string } = DocumentData & { id: string }
  >() {
    const data = [];
    const snap = await getDocs<T>(this.ref as CollectionReference<T>);
    return snap.docs.map((doc) => {
      let data = doc.data();
      data.id = doc.id;
      return data;
    });
  }

  async addDoc<T extends { [k: string]: any } = { [k: string]: any }>(
    data: T
  ): Promise<DocNode> {
    const docNode = new DocNode(doc(this.ref).id, this);
    const newData = data as { [k: string]: any };
    newData.path = docNode.objectPath();
    newData.createdTime = Timestamp.now();
    newData.updatedTime = Timestamp.now();
    newData.uids = [auth.currentUser?.uid || ""];
    newData._cref = docNode.ref.path;

    await setDoc(docNode.ref, newData);
    return docNode;
  }

  addSub(subCollection: CollectionNode): CollectionNode {
    return this.addSubcollection(subCollection);
  }

  doc(id: string): DocNode {
    return new DocNode(id, this);
  }
}

export class DocNode extends FirestoreNode {
  id: string;
  collection: CollectionNode;
  data: { [k: string]: any } = {};

  constructor(id: string, collection: CollectionNode) {
    super("document");
    this.collection = collection;
    this.id = id;
    this.path = collection.path + `/${this.id}`;
  }

  get ref() {
    return doc(db, this.path);
  }

  static initDoc(doc: { [k: string]: any }, collection: CollectionNode) {
    const newDoc = new DocNode(doc.id as string, collection);
    return newDoc;
  }

  async save<T = { [k: string]: any }>(data?: T): Promise<DocNode> {
    if (data) this.data = data;
    // if (Object.keys(data || {}).length) throw new Error('No data to save!');
    this.data.path = this.objectPath();
    const exists = (await this.get()).exists();
    if (!exists) {
      this.data.createdTime = Timestamp.now();
    }
    this.data.updatedTime = Timestamp.now();
    this.data.uids = arrayUnion(auth.currentUser?.uid || "");
    this.data._cref = this.ref.path;

    await setDoc(this.ref, this.data, { merge: true });
    return this;
  }

  update = async (data: { [k: string]: any }) => {
    data.path = this.objectPath();
    data.updatedTime = Timestamp.now();
    data.uids = arrayUnion(auth.currentUser?.uid || "");
    data._cref = this.ref.path;

    await setDoc(this.ref, data, { merge: true });
  };

  async softDelete() {
    await setDoc(
      this.ref,
      {
        deleted: true,
        deletedTime: Timestamp.now(),
      },
      { merge: true }
    );
  }

  async deleteForever() {
    await deleteDoc(this.ref);
  }

  get(): Promise<DocumentSnapshot<DocumentData>> {
    return getDoc(this.ref);
  }

  async exists(): Promise<boolean> {
    return (await this.get()).exists();
  }

  getSubcollection(subCollection: CollectionNode): CollectionNode {
    if (
      !this.collection.subCollections.some(
        (sub) => subCollection.name === sub.name
      )
    )
      throw new Error(
        `Sub-collection "${subCollection.name}" doesn't exist on "${this.collection.name}"`
      );

    const sub = this.collection.subCollections.find(
      (s) => s.name === subCollection.name
    ) as CollectionNode;
    sub.path = this.path + `/${sub.name}`;
    return sub;
  }

  sub(subCollection: CollectionNode) {
    return this.getSubcollection(subCollection);
  }
}

export const Items = new CollectionNode({
  name: CollectionName.Items,
  props: ["name", "code"],
});

export const Companies = new CollectionNode({
  name: CollectionName.Companies,
  props: ["name", "tinnumber"],
});

export const DefaultRoles = new CollectionNode({
  name: CollectionName.DefaultRoles,
});
export const GrantTransactions = new CollectionNode({
  name: CollectionName.GrantTransactions,
});

export const CompanyStats = new CollectionNode({
  name: CollectionName.CompanyStats,
});

export const CompanyBanks = new CollectionNode({
  name: CollectionName.CompanyBanks,
});

export const Admins = new CollectionNode({
  name: CollectionName.Admins,
  props: ["displayName", "email"],
});

export const Branches = new CollectionNode({
  name: CollectionName.Branches,
  props: ["name", "address"],
});

export const BranchExpenses = new CollectionNode({
  name: CollectionName.BranchExpenses,
});
export const EmptiesStock = new CollectionNode({
  name: CollectionName.EmptiesStock,
});

export const CheckedEmpties = new CollectionNode({
  name: CollectionName.CheckedEmpties,
});

export const SortedCheckedEmpties = new CollectionNode({
  name: CollectionName.SortedCheckedEmpties,
});

export const SortedEmpties = new CollectionNode({
  name: CollectionName.SortedEmpties,
});

export const SupplierEmptiesReturns = new CollectionNode({
  name: CollectionName.SupplierEmptiesReturns,
});

export const Grants = new CollectionNode({
  name: CollectionName.Grants,
});

export const BranchStats = new CollectionNode({
  name: CollectionName.BranchStats,
});

export const Permissions = new CollectionNode({
  name: CollectionName.Permissions,
  props: ["name"],
});
export const Roles = new CollectionNode({
  name: CollectionName.Roles,
  props: ["name", "permissions"],
});
export const Users = new CollectionNode({
  name: CollectionName.Users,
  props: ["name", "email", "role_id", "branch_id"],
});
export const SalesCart = new CollectionNode({
  name: CollectionName.SalesCart,
});
export const Transfers = new CollectionNode({
  name: CollectionName.Transfers,
});
export const TransferCart = new CollectionNode({
  name: CollectionName.TransferCart,
});
export const Inventory = new CollectionNode({
  name: CollectionName.Inventory,
  props: ["name", "description", "price", "quantity"],
});
export const Customers = new CollectionNode({
  name: CollectionName.Customers,
  props: ["name", "email", "phone", "address"],
});
export const CustomerFinances = new CollectionNode({
  name: CollectionName.CustomerFinances,
});
export const CustomerEmpties = new CollectionNode({
  name: CollectionName.CustomerEmpties,
});
export const EmptiesReturns = new CollectionNode({
  name: CollectionName.EmptiesReturns,
});
export const ItemsTaken = new CollectionNode({
  name: CollectionName.ItemsTaken,
});
export const FillableGroups = new CollectionNode({
  name: CollectionName.FillableGroups,
});
export const BranchFillables = new CollectionNode({
  name: CollectionName.BranchFillables,
});
export const Orders = new CollectionNode({
  name: CollectionName.Orders,
  props: ["date", "status", "items", "delivery"],
});
export const Payments = new CollectionNode({
  name: CollectionName.Payments,
  props: ["date", "amount", "method"],
});
export const Suppliers = new CollectionNode({
  name: CollectionName.Suppliers,
  props: ["name", "email", "phone", "address"],
});
export const Invoices = new CollectionNode({
  name: CollectionName.Invoices,
  props: ["number", "address"],
});
export const Sells = new CollectionNode({
  name: CollectionName.Sells,
});
export const SellsItems = new CollectionNode({
  name: CollectionName.SellsItems,
});
export const Purchases = new CollectionNode({
  name: CollectionName.Purchases,
  props: ["date", "status", "items", "payment"],
});
export const DamagedProducts = new CollectionNode({
  name: CollectionName.DamagedProducts,
  props: ["name", "description", "images", "quantity"],
});
export const CheckedDamagedProducts = new CollectionNode({
  name: CollectionName.CheckedDamagedProducts,
});
export const ReturnedProducts = new CollectionNode({
  name: CollectionName.ReturnedProducts,
  props: ["name", "description", "quantity"],
});
export const Locations = new CollectionNode({ name: CollectionName.Locations });
export const Allocations = new CollectionNode({
  name: CollectionName.Allocations,
});

// Add subcollections to companies
Companies.addSubcollection(Branches);
Companies.addSubcollection(Grants);
Companies.addSubcollection(Admins);
Companies.addSubcollection(CompanyStats);
Companies.addSubcollection(CompanyBanks);

// Add subcollections to grants
Grants.addSubcollection(GrantTransactions);

// Add subcollections to branches
Branches.addSubcollection(Users);
Branches.addSubcollection(Inventory);
Branches.addSubcollection(Roles);
Branches.addSubcollection(Inventory);
Branches.addSubcollection(Customers);
Branches.addSubcollection(Suppliers);
Branches.addSubcollection(DamagedProducts);
Branches.addSubcollection(CheckedDamagedProducts);
Branches.addSubcollection(ReturnedProducts);
Branches.addSubcollection(Locations);
Branches.addSubcollection(Transfers);
Branches.addSubcollection(BranchFillables);
Branches.addSubcollection(BranchStats);
Branches.addSubcollection(FillableGroups);
Branches.addSubcollection(BranchExpenses);
Branches.addSubcollection(SupplierEmptiesReturns);
Branches.addSubcollection(EmptiesStock);
Branches.addSubcollection(CheckedEmpties);
Branches.addSubcollection(SortedEmpties);
Branches.addSubcollection(SortedCheckedEmpties);
// Add subcollections to sort
Branches.addSubcollection(Sells);
// add sellsItem to sells
Sells.addSubcollection(SellsItems);
// Add subcollections to branch fillables
BranchFillables.addSubcollection(ItemsTaken);
BranchFillables.addSubcollection(EmptiesReturns);

// Add subcollections to customers
Customers.addSubcollection(ItemsTaken);
Customers.addSubcollection(EmptiesReturns);
Customers.addSubcollection(CustomerFinances);

// Add subcollections to roles
Roles.addSubcollection(Permissions);

// Add subcollections to users
Users.addSubcollection(Roles);
Users.addSubcollection(Permissions);
Users.addSubcollection(SalesCart);
Users.addSubcollection(TransferCart);

// Add subcollections to inventory
Inventory.addSubcollection(DamagedProducts);
Inventory.addSubcollection(ReturnedProducts);
Inventory.addSubcollection(Allocations);

// Add subcollections to customers
Customers.addSubcollection(Orders);
Customers.addSubcollection(Payments);

// Add subcollections to suppliers
// Suppliers.addSubcollection(Purchases);
Suppliers.addSubcollection(Payments);
Suppliers.addSubcollection(Invoices);

// Add subcollections to invoices
Invoices.addSubcollection(Purchases);
