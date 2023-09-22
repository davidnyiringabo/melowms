import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Branch,
  Customer,
  Fillable,
  FilterNonMethods,
  OrderItem,
  PayInfo,
  RemoteConfirm,
  RemoteConfirmTransfer,
  SalesState,
} from "../types";
import { useCustomAuth } from "./Auth";
import {
  BranchFillables,
  Branches,
  Companies,
  CustomerEmpties,
  Customers,
  DocNode,
  SalesCart,
  Users,
} from "../database";
import { useFirestoreDocData, useFunctions } from "reactfire";
import { HttpsCallableResult, httpsCallable } from "firebase/functions";
import cloudFunctionNames from "../functionNames";

export type SalesProviderProps = PropsWithChildren<{
  localKey: string;
  isTransfer?: boolean;
  cartId: string;
  cloudFunctionName: cloudFunctionNames;
}>;

const SalesContext = React.createContext<SalesState>({
  orderItems: [],
  totalQuantity: 0,
  totalTax: 0,
  customerEmpties: 0,
  willPayCaution: false,
  customer:{
    path: {},
    id: "",
    name: "",
    email: "",
    phone: "",
    totalCredit: 0,
    totalDebit: 0,
    tinnumber: "",
    address: "",
    emptiesBalance: 0,
    defaultDiscount: 0,
    totalReturned: 0,
    totalTaken: 0,
    // unprocessed: 0,
  },
  isTransfer: false,
  costAfterDiscount: 0,
  status: "loading",
  payInfo: { payAmount: 0, payDate: "", payMethod: "", discount: 0 },
  orderItemsCost: 0,
  changeCustomer: function (newCustomer?: Customer): void {},
  addOrderItem: function (orderItem: OrderItem): void {},
  replaceOrderItem: function (
    prevOrderItem: OrderItem,
    orderItem: OrderItem
  ): void {},
  removeOrderItem: function (orderItem: OrderItem): void {},
  handleSaveSalesCart: function (): void {},
  changePayInfo: (): void => {},
  checkBranchFillables: (): Promise<[boolean, string | undefined]> => {
    return Promise.resolve([false, "Unexpeted error"]);
  },
  checkCustomerFillables: (): Promise<[boolean, string | undefined]> => {
    return Promise.resolve([false, "Unexpeted error"]);
  },
  handleConfirmSale: function (): Promise<HttpsCallableResult<unknown>> {
    return Promise.resolve({ data: undefined });
  },
  handleConfirmTransfer: function (): Promise<HttpsCallableResult<unknown>> {
    return Promise.resolve({ data: undefined });
  },
  changeBranch: function (branch?: Branch | undefined): void {},
  handleClearCart: function (): void {},
});
export const useSalesContext = () => useContext(SalesContext);

const defaultPayInfo = {
  discount: 0,
  payAmount: 0,
  payDate: new Date(),
  payMethod: "",
};

export default function SalesProvider({
  cartId,
  localKey,
  cloudFunctionName,
  isTransfer = false,
  children,
}: SalesProviderProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<Customer>();
  const [payInfo, setPayInfo] = useState<PayInfo>(defaultPayInfo);
  const { currentUser, Branch } = useCustomAuth();
  const [isDbInit, setIsDbInit] = useState(false);
  const [isLocalInit, setIsLocalInit] = useState(false);
  const [changes, setChanges] = useState(0);
  const [branch, setBranch] = useState<Branch>();
  const [customerEmpties, setCustomerEmpties ] = useState(0);
  const { branchData } = useCustomAuth();

  const orderItemsCost = useMemo(() => {
    return orderItems.reduce((acc, c) => acc + c.totalPrice, 0);
  }, [orderItems]);
  const totalQuantity = useMemo(() => {
    return orderItems.reduce((acc, c) => acc + c.quantity, 0);
  }, [orderItems]);

  const remoteConfirmSaleOrTransfer = httpsCallable<
    Partial<RemoteConfirm | RemoteConfirmTransfer>
  >(useFunctions(), cloudFunctionName);

  const handleConfirmSale = async () => {
    if (!customer) return;
    const cartDoc = (Branch as DocNode)
      .sub(Users)
      .doc(currentUser?.uid as string)
      .sub(SalesCart)
      .doc(cartId);
    const customerDoc = Companies.doc(customer.path.companies)
      .sub(Branches)
      .doc(customer.path.branches)
      .sub(Customers)
      .doc(customer.id);

    await handleSaveDataToDatabase();

    const result = (await remoteConfirmSaleOrTransfer({
      cartDoc: cartDoc.ref.path,
      customerDoc: customerDoc.ref.path,
    })) as HttpsCallableResult<unknown>;

    handleClearCart();
    return result;
  };

  const handleConfirmTransfer = async () => {
    if (!branch) throw new Error("No branch selected!");
    const cartDoc = (Branch as DocNode)
      .sub(Users)
      .doc(currentUser?.uid as string)
      .sub(SalesCart)
      .doc(cartId);
    const branchDoc = Companies.doc(branch.path.companies)
      .sub(Branches)
      .doc((branch as Branch).path.branches);

    await handleSaveDataToDatabase();

    const result = (await remoteConfirmSaleOrTransfer({
      branch: (Branch as DocNode).ref.path,
      receiverBranch: branchDoc.ref.path,
      cartDoc: cartDoc.ref.path,
    })) as HttpsCallableResult<unknown>;

    handleClearCart();
    return result;
  };

  const checkCustomerFillables = useCallback(async (): Promise<
    [boolean, string | undefined]
  > => {
    if (!customer || Object.keys(customer).length === 0) {
      return [false, "No customer was choosen"];
    }
    if (totalQuantity === 0) {
      return [false, "You can't sell empty quantity, please select items."];
    }

    // const customerDoc = Companies.doc(customer.path.companies)
    //   .sub(Branches)
    //   .doc(customer.path.branches)
    //   .sub(Customers)
    //   .doc(customer.id);
    // const fillables = await customerDoc
    //   .sub(CustomerEmpties)
    //   .getDocs<Fillable>();
    // const fillable = fillables[0];
    // if (!fillable)
    //   return [
    //     false,
    //     `The customer "${customer.name}" is not allowed to take any fillables.`,
    //   ];
    // if (totalQuantity > fillable.allowedNow) {
    //   return [
    //     false,
    //     `The customer "${customer.name}" is allowed to take "${
    //       fillable.allowedNow
    //     }" fillables now. But this sale needs "${totalQuantity}" fillables. They should return at least "${
    //       totalQuantity - fillable.allowedNow
    //     }", or have their maximum fillables increased.`,
    //   ];
    // }
    return [true, undefined];
  }, [customer, totalQuantity]);

  const checkBranchFillables = useCallback(async (): Promise<
    [boolean, string | undefined]
  > => {
    if (!branch || Object.keys(branch).length === 0) {
      return [false, "No branch was choosen"];
    }
    if (totalQuantity === 0) {
      return [false, "You can't transfer empty quantity, please select items."];
    }

    // const fillable = (await Companies.doc(branch.path.companies)
    //   .sub(Branches)
    //   .doc((branchData as Branch).id)
    //   .sub(BranchFillables)
    //   .doc(branch.path.branches)
    //   .get()) as unknown as Fillable;

    // if (!fillable)
    //   return [
    //     false,
    //     `The branch "${branch.name}" is not allowed to take any fillables.`,
    //   ];
    // if (totalQuantity > fillable.allowedNow) {
    //   return [
    //     false,
    //     `The branch "${branch.name}" is allowed to take "${
    //       fillable.allowedNow
    //     }" fillables now. But this transfer needs "${totalQuantity}" fillables. They should return at least "${
    //       totalQuantity - fillable.allowedNow
    //     }", or have their maximum fillables increased.`,
    //   ];
    // }
    return [true, undefined];
  }, [branch, totalQuantity]);

  const totalTax = useMemo(
    () =>
      orderItems
        .filter((oi) => oi.taxCode === "B")
        .reduce((a, c) => a + (c.taxAmount ?? 0), 0),
    [orderItems]
  );

  const costAfterDiscount = useMemo(() => {
    const itemsAfterDiscount = orderItems.reduce(
      (acc, c) => acc + c.totalAfterDiscount,
      0
    );
    return (
      itemsAfterDiscount -
      Number(((itemsAfterDiscount * (payInfo.discount ?? 0)) / 100).toFixed(2))
    );
  }, [orderItems, payInfo.discount]);

  const dbDoc = (Branch as DocNode)
    .sub(Users)
    .doc(currentUser?.uid as string)
    .sub(SalesCart)
    .doc(cartId);

  const { status, data: initData } = useFirestoreDocData(dbDoc.ref);

  useEffect(() => {
    if (!isDbInit) return;
    if (isLocalInit) return;

    const localData = localStorage.getItem(localKey);

    const data = localData ? JSON.parse(localData) : ("" as SalesState | "");
    if (data === "") {
      return setIsLocalInit(true);
    }

    setOrderItems(data.orderItems ?? []);
    setCustomer(data.customer);
    setBranch(data.branch);
    setPayInfo(data.payInfo ?? defaultPayInfo);
    setIsLocalInit(true);
  }, [isDbInit, isLocalInit]);

  useEffect(() => {
    if (!isDbInit && initData) {
      setIsDbInit(true);
      setOrderItems(initData.orderItems ?? []);
      setCustomer(initData.customer);
      setBranch(initData.branch);
      setPayInfo(initData.payInfo ?? defaultPayInfo);
      setIsDbInit(true);
    } else if (!isDbInit && status === "success") {
      setIsDbInit(true);
    }
  }, [initData, isDbInit, status]);

  const changePayInfo = (payInfo: PayInfo) => {
    setPayInfo(payInfo);
    setChanges((p) => p + 1);
  };

  const handleClearCart = () => {
    localStorage.removeItem(localKey);
    setOrderItems([]);
    setChanges(0);
    setCustomer(undefined);
    setBranch(undefined);
    setPayInfo(defaultPayInfo);
    orderItems.map((oi) => removeOrderItem(oi));
    handleSaveDataToDatabase(true);
  };

  const handleSaveDataToDatabase = async (clear = false) => {
    const data: FilterNonMethods<SalesState> = {
      orderItems,
      orderItemsCost,
      totalQuantity,
      totalTax,
      costAfterDiscount,
      branch: (branch ?? {}) as Branch,
      payInfo,
      customer: (customer ?? {}) as Customer,
      isTransfer,
      status: "loading",
      willPayCaution: false,
      customerEmpties: 0
    };

    return (Branch as DocNode)
      .sub(Users)
      .doc(currentUser?.uid as string)
      .sub(SalesCart)
      .doc(cartId)
      .save(clear ? {} : data);
  };

  const handleSaveSalesCart = () => {
    const localData: FilterNonMethods<SalesState> = {
      orderItems,
      payInfo,
      orderItemsCost,
      totalQuantity,
      totalTax,
      costAfterDiscount,
      branch: (branch ?? {}) as Branch,
      customer: (customer ?? {}) as Customer,
      isTransfer,
      willPayCaution: false,
      status: "loading",
      customerEmpties: 0
    };
    localStorage.setItem(localKey, JSON.stringify(localData));
  };

  useEffect(() => {
    if (changes === 0 || !isLocalInit) return;
    handleSaveSalesCart();
    setChanges(0);
  }, [
    changes,
    isLocalInit,
    branch,
    totalTax,
    customer,
    orderItems,
    totalQuantity,
    payInfo,
    costAfterDiscount,
    orderItemsCost,
  ]);

  const addOrderItem = (orderItem: OrderItem) => {
    setOrderItems((p) => {
      if (p.findIndex((o) => o.item === orderItem.item) !== -1) return p;
      return [{ ...orderItem }, ...p];
    });
    setChanges((p) => p + 1);
  };

  const changeCustomer = (newCustomer: Customer | undefined) => {
    setCustomer(newCustomer);
    setChanges((p) => p + 1);
  };
  const changeBranch = (branch: Branch | undefined) => {
    setBranch(branch);
    setChanges((p) => p + 1);
  };

  const removeOrderItem = (orderItem: OrderItem) => {
    setOrderItems((p) => [...p.filter((i) => i.id !== orderItem.id)]);
    setChanges((p) => p + 1);
  };

  const replaceOrderItem = (prevOrderItem: OrderItem, orderItem: OrderItem) => {
    setOrderItems((p) => {
      const newItems = [...p];
      newItems[newItems.findIndex((i) => i.id === prevOrderItem.id)] =
        orderItem;
      return newItems;
    });
    setChanges((p) => p + 1);
  };
  const [willPayCaution, setWillPayCaution] = useState(false);
  return (
    <SalesContext.Provider
      value={{
        handleClearCart,
        branch,
        totalTax,
        changeBranch,
        checkBranchFillables,
        isTransfer,
        payInfo,
        checkCustomerFillables,
        totalQuantity,
        costAfterDiscount,
        status,
        changePayInfo,
        handleConfirmTransfer,
        handleConfirmSale,
        removeOrderItem,
        handleSaveSalesCart,
        replaceOrderItem,
        addOrderItem,
        changeCustomer,
        orderItems: orderItems,
        orderItemsCost,
        customer: customer,
        willPayCaution: willPayCaution,
        setWillPayCaution: setWillPayCaution,
        setCustomerEmpties: setCustomerEmpties,
        customerEmpties: customerEmpties
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}
