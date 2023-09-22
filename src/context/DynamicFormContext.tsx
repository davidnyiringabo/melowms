import { DocumentData, Query } from "firebase/firestore";
import React, { ReactNode } from "react";
import {
  FieldValues,
  Path,
  SubmitHandler,
  UseFormSetValue,
} from "react-hook-form";
import { TypeOf, ZodObject, z } from "zod";
import { CellTransform } from "./TableContext";

export const DyamicFormContext = React.createContext<
  DynamicFormProps<z.ZodObject<any>>
>({
  schema: {} as ZodObject<any>,
  updateString: "",
  onSubmit: function (
    data: { [x: string]: any },
    event?: React.BaseSyntheticEvent<object, any, any> | undefined
  ) {},
  metadata: {},
  modifyFieldMeta: () => undefined,
});

export const useDynamicForm = () => React.useContext(DyamicFormContext);

export default DyamicFormContext;
export type ModifyMeta<T extends z.ZodObject<any>> = (
  name: Path<TypeOf<T>>,
  fMeta: FieldMetadata<T>
) => void;
export type CalcFunction<
  T extends z.ZodObject<any> = any,
  P = FieldValues[Path<TypeOf<T>>][],
  V = any
> = (args: {
  fields: P;
  value: V;
  setValue: UseFormSetValue<FieldValues>;
  modifyFieldMeta: (name: Path<TypeOf<T>>, fMeta: FieldMetadata<T>) => void;
  fMeta: FieldMetadata<T>;
}) => any;

export type OnSelectFn<
  P extends DocumentData = DocumentData,
  T extends z.ZodObject<any> = any
> = (
  record: P,
  setValue: UseFormSetValue<FieldValues>,
  modifyFieldMeta: ModifyMeta<T>
) => void;

export type SchemaChange = (setValue: UseFormSetValue<FieldValues>) => void;

export type FieldMetadata<T extends z.ZodObject<any>> = Partial<{
  options: { [k: string]: any };
  meta: { [k: string]: FieldMetadata<T> };
  label: string;
  placeholder: string;
  hidden: boolean;
  columns: string[];
  transform: CellTransform<T>;
  initItem: { [k: string]: any };
  password: boolean;
  query: Query;
  canSearchQuery: boolean;
  onlyOptions: boolean;
  getUpdateForm: (instance: { [k: string]: any }) => React.ReactNode;
  searchField: string;
  multiple: boolean;
  cantAdd: boolean;
  disabled: boolean;
  selected: string;
  watchFields: Path<TypeOf<T>>[];
  calculate: CalcFunction<T>;
  onSelect: OnSelectFn;
  collectionName: string;
  collectionNameSingular: string;
  helpText: string;
  addForm: React.ReactNode;
  warningText: string;
  important: boolean;
  value: string;
  required: boolean;
  display: string;
}>;
export type FieldsMetadata<T extends z.ZodObject<any>> = {
  [k in Path<TypeOf<T>>]?: FieldMetadata<T>;
};

export type DynamicFormProps<T extends z.ZodObject<any>> = {
  schema: T;
  action?: string | ReactNode;
  instance?: { [k: string]: any };
  additionValidation?: (data: { [k: string]: any }) => Promise<{
    message?: string;
    status: boolean;
  }>;
  additionValidationModal?: (message: string) => React.ReactNode;
  onSubmit: SubmitHandler<z.infer<T>>;
  onSchemaChange?: SchemaChange;
  refineCallbacks?: Array<{
    fn: (data: { [k in Path<TypeOf<T>>]: any }) => boolean;
    args: { path: string[]; message: string };
  }>;
  metadata?: FieldsMetadata<T>;
  multiLevel?: boolean;
  className?: string;
  isMini?: boolean;
  inputsPerLevel?: number;
  hiddenInputs?: number;
  updateString?: string;
  autoSave?: boolean;
  modifyFieldMeta?: ModifyMeta<T>;
  onFieldsChange?: (data: any) => void;
};
