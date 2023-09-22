import {
  DocumentData,
  Query,
  QuerySnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { CollectionNode } from "../database";
import usePaginatedCollection, {
  OrderBy,
} from "../hooks/usePaginatedCollection";
import { DocNode } from "../database";
import moment from "moment";
import { number } from "zod";

export type ColCollection<T extends DocumentData = DocumentData> = {
  column: string;
  getCollection: (record: T) => CollectionNode;
  display: string;
};
export type CellTransform<T extends DocumentData> = {
  [k in keyof T]: (record: T) => string | React.ReactNode;
};

export type TableTotal = {
  totalName: string;
  value: number;
  important?: boolean;
};

export type GetRecordStyles<TX extends DocumentData> = (
  record: TX
) => React.CSSProperties;

export type TotalCalc<TT extends { [k: string]: any }> = (
  data: TT[]
) => TableTotal[];

export type DataTransformer<TT extends { [k: string]: any }> = (
  data: TT[]
) => TT[];

export type TableProps<T extends DocumentData = DocumentData> = {
  query: Query<DocumentData>;
  cantUpdate?: boolean | ((record: DocumentData) => boolean);
  cantDelete?: boolean | ((record: DocumentData) => boolean);
  showField?: string;
  hasTotals?: boolean;
  setYourData?: (
    setData: React.Dispatch<React.SetStateAction<DocumentData[]>>
  ) => void;
  getRecords?: (records: DocumentData[]) => void;
  hasCustomRange?: boolean;
  deletedRecord?: (record: DocumentData) => void;
  getRecordClasses?: <TX extends DocumentData = DocumentData>(
    record: TX
  ) => string;
  getRecordStyles?: GetRecordStyles<any>;
  startDate?: Date;
  endDate?: Date;
  totalCalc?: TotalCalc<any>;
  canSelect?: boolean;
  defaultSelected?: string | string[];
  defaultView?: string;
  defaultSearchField?: string;
  canSelectMultiple?: boolean;
  change?: boolean;
  canRange?: boolean;
  onSelectInstance?: (instances: DocumentData[]) => void;
  collectionName: string;
  searchField?: string;
  cantView?: boolean;
  collectionSingular?: string;
  customHeader?: React.ReactNode;
  createForm: React.ReactNode;
  updateForm?: React.ReactNode;
  getUpdateForm?: (instance: { [k: string]: any }) => React.ReactNode;
  onShow?: (instance: any) => React.ReactNode;
  columns?: Array<keyof T>;
  transform?: CellTransform<T>;
  columsAs?: { [k in keyof T]: string };
  columnCollection?: ColCollection;
  pageSize?: number;
  onDelete?: (id: string) => void;
  maxCreate?: number;
  cantSearch?: boolean;
  cantAct?: boolean;
  orderBy?: OrderBy<T>;
  transformData?: DataTransformer<any>;
};

export type TableContextProps = TableProps & {
  initialData: DocumentData[];
  filteredData: DocumentData[];
  startDate: Date;
  endDate: Date;
  selectedIds: string[];
  status: "loading" | "error" | "success";
  updateInstance: DocumentData | null;
  viewInstance: DocumentData | null;
  handleSelectRecords: (record: DocumentData | undefined) => void;
  handleSetUpdateInstance: (record: DocumentData | null) => void;
  handleSetViewInstance: (record: DocumentData | null) => void;
  handleChangeFilteredData: (filteredData: DocumentData[]) => void;
  handleDeleteRecord: (doc: DocNode) => void;
  handleUpdateRange: (start: Date, end: Date) => void;
  hasNext: boolean;
  page: number;
  hasPrev: boolean;
  nextData: () => Promise<void>;
  prevData: () => void;
  handleChangePageSize: (newPageSize: number) => void;
  handleChangOrderBy: (orderBy: OrderBy<DocumentData>) => void;
};

const TableContext = React.createContext<TableContextProps>({
  query: {} as Query,
  collectionName: "",
  createForm: undefined,
  customHeader: undefined,
  startDate: moment().toDate(),
  endDate: moment().add("day").toDate(),
  initialData: [],
  canRange: false,
  filteredData: [],
  selectedIds: [],
  updateInstance: null,
  viewInstance: null,
  setYourData: (
    setData: React.Dispatch<React.SetStateAction<DocumentData[]>>
  ) => undefined,
  getRecords: (records: DocumentData[]) => undefined,
  handleSelectRecords: (record?: DocumentData) => undefined,
  handleSetUpdateInstance: (record: DocumentData | null) => undefined,
  handleSetViewInstance: (record: DocumentData | null) => undefined,
  handleChangeFilteredData: (filteredData: DocumentData[]) => undefined,
  handleDeleteRecord: (doc: DocNode) => undefined,
  status: "loading",
  hasNext: false,
  page: 0,
  hasPrev: false,
  nextData: () => Promise.resolve(undefined),
  prevData: () => undefined,
  handleChangePageSize: (newPageSize: number) => undefined,
  handleChangOrderBy: (orderBy: OrderBy<DocumentData>) => undefined,
  maxCreate: Infinity,
  handleUpdateRange: function (start: Date, end: Date): void {},
});

export const useTableContext = () => React.useContext(TableContext);

export default function TableProvider({
  defaultSelected,
  defaultView,
  canSelectMultiple = false,
  orderBy,
  canRange = false,
  ...props
}: PropsWithChildren<TableProps>) {
  const [data, setData] = useState<DocumentData[]>([]);
  const onSelectRef = useRef(props.onSelectInstance);
  const [selectedIds, setSelectedIds] = useState<Array<string>>([]);
  const [pageSize, setPageSize] = useState(props.pageSize || Infinity);
  const [defaultSearch, setDefaultSearch] = useState(props.defaultSearchField);
  const [startDate, setStartDate] = useState(
    props.startDate ?? moment().startOf("day").toDate()
  );
  const [endDate, setEndDate] = useState(
    props.endDate ?? moment().endOf("day").toDate()
  );
  const [orderByState, setOrderByState] = useState<OrderBy<DocumentData>>(
    orderBy ?? { direction: "desc", field: "createdTime" }
  );
  const [resultQuery, setResultQuery] = useState(
    !canRange
      ? props.query
      : query(
          props.query,
          where("createdTime", ">=", startDate),
          where("createdTime", "<=", endDate)
        )
  );

  useEffect(() => {
    setStartDate(props.startDate ?? moment().startOf("day").toDate());
    setEndDate(props.endDate ?? moment().endOf("day").toDate());
  }, [props.startDate, props.endDate]);

  const [updateInstance, setUpdateInstance] = useState<{
    [k: string]: any;
  } | null>(null);
  const [viewInstance, setViewInstance] = useState<{ [k: string]: any } | null>(
    null
  );

  const handleChangePageSize = (newPageSize: number) =>
    setPageSize(newPageSize);

  const handleChangOrderBy = (orderBy: OrderBy<DocumentData>) => {
    setOrderByState(orderBy);
  };

  useEffect(() => {
    setDefaultSearch(props.defaultSearchField);
  }, [props.defaultSearchField]);

  useEffect(() => {
    if (!canRange) return setResultQuery(props.query);

    setResultQuery(
      query(
        props.query,
        where("createdTime", ">=", startDate),
        where("createdTime", "<=", endDate)
      )
    );
  }, [props.query, canRange, startDate, endDate]);

  const {
    data: initialData,
    status,
    next,
    prev,
    nextDisabled,
    prevDisabled,
    page,
  } = usePaginatedCollection({
    limit: pageSize,
    orderBy: orderByState,
    query: resultQuery,
  });

  useEffect(() => {
    const inData = transformInitialData(initialData);
    if (inData) {
      setData(inData);
    }
  }, [initialData]);

  useEffect(() => {
    if (props.setYourData) {
      props.setYourData(setData);
    }
  }, [props.change]);

  useEffect(() => {
    if (defaultView && data) {
      const instance = data.find((is) => is.id === defaultView);
      instance && setViewInstance(instance);
    }
  }, [defaultView, data]);

  useEffect(() => {
    if (typeof defaultSelected === "string") {
      setSelectedIds([defaultSelected]);
    } else if (typeof defaultSelected === "object") {
      setSelectedIds(
        [...defaultSelected].filter((s) => typeof s !== "undefined")
      );
    }
  }, [defaultSelected]);

  useEffect(() => {
    // const onSelectInstance = onSelectRef.current;
    onSelectRef.current &&
      onSelectRef.current(
        selectedIds.map(
          (id) => data.find((instance) => instance.id === id) as DocumentData
        )
      );
  }, [selectedIds]);

  const transformInitialData = (
    snapshot: QuerySnapshot<DocumentData> | undefined
  ): DocumentData[] | undefined => {
    if (!snapshot) return;
    const initData = snapshot.docs.map((doc) => {
      const docData = doc.data();
      docData.id = doc.id;
      return docData;
    });
    return props.transformData ? props.transformData(initData) : initData;
  };

  const handleSelectRecords = (record?: DocumentData) => {
    if (typeof record === "undefined") {
      if (selectedIds.length === data.length) setSelectedIds([]);
      else setSelectedIds(data.map((d) => d.id));
      return;
    }

    selectedIds.includes(record.id)
      ? setSelectedIds((p) => p.filter((i) => i !== record.id))
      : setSelectedIds((p) =>
          canSelectMultiple
            ? [...p.filter((p) => p !== record.id), record.id]
            : [record.id]
        );
  };

  const handleSetUpdateInstance = (record: DocumentData | null) => {
    setUpdateInstance(record);
  };
  const handleSetViewInstance = (record: DocumentData | null) => {
    setViewInstance(record);
  };

  const handleChangeFilteredData = (filteredData: DocumentData[]) => {
    setData(
      props.transformData ? props.transformData(filteredData) : filteredData
    );
  };

  const handleUpdateRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleDeleteRecord = async (doc: DocNode) => {
    await doc.deleteForever();
  };

  const singular =
    props.collectionSingular || props.collectionName.slice(0, -1);
  return (
    <TableContext.Provider
      value={{
        cantDelete: true,
        cantUpdate: false,
        ...props,
        startDate,
        endDate,
        canRange,
        handleUpdateRange,
        handleDeleteRecord,
        defaultSearchField: defaultSearch,
        maxCreate: props.maxCreate ?? Infinity,
        page,
        handleChangePageSize,
        nextData: next,
        orderBy: orderByState,
        handleChangOrderBy,
        prevData: prev,
        hasNext: !nextDisabled,
        hasPrev: !prevDisabled,
        viewInstance,
        initialData: transformInitialData(initialData) || [],
        filteredData: data,
        selectedIds,
        collectionSingular: singular,
        handleSetUpdateInstance,
        handleSetViewInstance,
        status,
        updateInstance,
        handleChangeFilteredData,
        handleSelectRecords,
      }}
    >
      {props.children}
    </TableContext.Provider>
  );
}
