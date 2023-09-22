import {
  Controller,
  FieldArray,
  FieldError,
  FieldValues,
  PathValue,
  useFieldArray,
  useFormContext,
} from 'react-hook-form';
import { ModifyMeta, useDynamicForm } from '../context/DynamicFormContext';
import {
  TypeOf,
  ZodAny,
  ZodAnyDef,
  ZodEnumDef,
  ZodLiteralDef,
  ZodObject,
  z,
} from 'zod';
import { Path } from 'react-hook-form';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Table, { toNormalCase } from '../components/Table';
import { useFirestoreCollectionData } from 'reactfire';
import { DocumentData, Query } from 'firebase/firestore';
import Spinner from '../components/Spinner';
import {
  MdAdd,
  MdArrowCircleRight,
  MdClose,
  MdDelete,
  MdMoreHoriz,
  MdRemoveRedEye,
} from 'react-icons/md';
import Modal from '../components/Modal';
import DynamicForm from '../components/forms/Form';
import { objectEquals } from '../components/forms/InvoicesForm';
import Select from 'react-select';
import { Field } from '../hooks/useFormFields';
import { CellTransform } from '../context/TableContext';

export type FieldProps<T extends z.ZodObject<any>> = {
  name: Path<TypeOf<T>>;
};
export type SelectOption = { value: unknown; label: string };

export const SelectInput = <T extends z.ZodObject<any>>({
  fieldDef,
  defaultValue,
  name,
}: FieldProps<T> & { defaultValue: any; fieldDef: ZodEnumDef }) => {
  const { metadata = {} } = useDynamicForm();
  const { control, trigger } = useFormContext();

  const initOptions = metadata[name] ? metadata[name]?.options : undefined;
  const options: SelectOption[] = metadata[name]?.onlyOptions
    ? Object.entries(metadata[name]?.options as { [k: string]: any }).map(
        ([k, v]) => ({ label: k, value: v })
      )
    : (fieldDef as unknown as ZodEnumDef).values.map((value) => {
        return {
          label: initOptions ? initOptions[value] || value : value,
          value: metadata[name]?.value ?? value,
        };
      });

  const isMulti = metadata[name]?.multiple === true;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, ref, ...rest } }) => {
        return (
          <Select
            isSearchable
            ref={ref}
            className="w-full"
            options={options}
            onChange={(val, meta) => {
              const value = isMulti
                ? (val as SelectOption[]).map((op) => op.value)
                : (val as SelectOption).value;
              onChange(value);
              trigger(name);
            }}
            value={options.find((c) => c.value === value)}
            isMulti={isMulti}
            defaultValue={
              value
                ? isMulti
                  ? value.map((v: any) => ({ label: v, value: v }))
                  : { label: value, value }
                : undefined
            }
            {...rest}
          />
        );
      }}
    />
  );
};

export const SelectMultipleInput = <T extends z.ZodObject<any>>({
  defaultValue,
  name,
}: FieldProps<T> & { defaultValue: any }) => {
  const { metadata = {} } = useDynamicForm();
  const { register, control } = useFormContext();
  const options: SelectOption[] = metadata[name]?.options?.map(
    ([key, value]: [any, Path<TypeOf<T>>]) => {
      return { value, label: key };
    }
  );

  const isMulti = metadata[name]?.multiple ?? true;

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, ref, ...rest } }) => {
        return (
          <Select
            isSearchable
            ref={ref}
            className="w-full"
            options={options}
            onChange={(val, meta) => {
              const value = isMulti
                ? (val as SelectOption[]).map((op) => op.value)
                : [(val as SelectOption).value];
              onChange(value);
            }}
            value={options.find((c) => c.value === value)}
            isMulti={isMulti}
            defaultValue={
              value
                ? isMulti
                  ? value.map((v: any) => ({ label: v, value: v }))
                  : { label: value, value }
                : undefined
            }
            {...rest}
          />
        );
      }}
    />
  );
};

export const CommonFieldInput = <T extends z.ZodObject<any>>({
  defaultValue,
  fieldDef,
  fieldType,
  name,
}: FieldProps<T> & {
  defaultValue: any;
  fieldType: string;
  fieldDef: ZodAnyDef;
}) => {
  const { register } = useFormContext();
  const { metadata = {} } = useDynamicForm();

  return (
    <input
      id={name}
      placeholder={toNormalCase(metadata[name]?.placeholder || name)
        .split('.')
        .pop()}
      step={'any'}
      defaultValue={
        (fieldDef as unknown as ZodLiteralDef)?.value ??
        defaultValue ??
        undefined
      }
      disabled={metadata[name]?.disabled}
      {...(fieldType === 'hidden' || metadata[name]?.hidden
        ? {
            value:
              (fieldDef as unknown as ZodLiteralDef)?.value ??
              defaultValue ??
              undefined,
          }
        : {})}
      key={name}
      {...register(name, {
        ...(fieldType === 'hidden' || metadata[name]?.hidden
          ? {
              value: (fieldDef as unknown as ZodLiteralDef).value || undefined,
              setValueAs(value) {
                try {
                  return ['true', 'false'].includes(value)
                    ? JSON.parse(value)
                    : value;
                } catch (error) {
                  return value;
                }
              },
            }
          : {}),
        ...(fieldType === 'number'
          ? { valueAsNumber: true, value: defaultValue ?? undefined }
          : {
              ...(fieldType === 'date'
                ? {
                    value: defaultValue
                      ? defaultValue.toISOString().substring(0, 10)
                      : undefined,
                    valueAsDate: true,
                  }
                : {
                    value: defaultValue ?? undefined,
                  }),
            }),
      })}
      name={name}
      type={metadata[name]?.hidden ? 'hidden' : fieldType}
    />
  );
};

export const InputWrapper = <T extends z.ZodObject<any>>({
  defaultValue,
  fieldDef,
  fieldType: originalFieldType,
  name,
  children,
}: PropsWithChildren<
  FieldProps<T> & {
    defaultValue: any;
    fieldType: string;
    fieldDef: ZodAnyDef;
  }
>) => {
  const {
    formState: { errors },
  } = useFormContext();
  const viewPassRef = useRef<HTMLButtonElement | null>(null);

  const { metadata = {} } = useDynamicForm();

  const handleViewPass = () => {
    if (!viewPassRef.current) return;
    const btn = viewPassRef.current;
    const input = btn.closest('label')?.querySelector(`input`);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  let fieldType = metadata[name]?.hidden ? 'hidden' : originalFieldType;
  const isNotHidden = fieldType !== 'hidden' && !metadata[name]?.canSearchQuery;

  return (
    <div key={name}>
      <label
        {...(fieldType !== 'hidden'
          ? {
              className: ` relative ${
                fieldType === 'checkbox' ? 'items-center' : ' flex-col'
              }
        ${
          metadata && !metadata[name]?.canSearchQuery
            ? ' justify-between flex-row w-full gap-3 '
            : ''
        }
        my-1 flex gap-2 items-start "`,
            }
          : {})}
        htmlFor={name}
      >
        {isNotHidden && (
          <span
            className={`${
              metadata[name]?.important ? 'font-bold' : ''
            }  inline-block`}
          >
            {toNormalCase(metadata[name]?.label || name)
              .split('.')
              .pop()}{' '}
            {metadata[name]?.important ? '*' : ''}
          </span>
        )}
        {children}
        {isNotHidden && metadata[name]?.password && (
          <button
            onClick={handleViewPass}
            ref={viewPassRef}
            type="button"
            className="absolute icon-button-outline p-1 top-[3rem] right-2 -translate-y-1"
          >
            <MdRemoveRedEye />
          </button>
        )}
      </label>

      {metadata[name]?.helpText && fieldType !== 'hidden' && (
        <p className="text-gray-600 font-bold text-xs my-1 w-full">
          {metadata[name]?.helpText}
        </p>
      )}
      {metadata[name]?.warningText && fieldType !== 'hidden' && (
        <p className="text-red-400 font-bold text-xs my-1 w-full">
          {metadata[name]?.warningText}
        </p>
      )}

      {name.includes('.') &&
        name.split('.').reduce((p, c) => p[c] ?? '', errors as any)
          ?.message && (
          <p className="text-red-400 my-1 test-xs">
            {
              name.split('.').reduce((p, c) => p[c] ?? '', errors as any)
                ?.message
            }
          </p>
        )}
      {errors[name] ? (
        <p className="text-red-400 my-1 test-sm">
          {
            (fieldType !== 'select'
              ? errors[name]?.message
                  ?.toString()
                  .replace(/^(Array|String|Number)/, toNormalCase(name))
                  .replace(/, received nan/, '')
                  ?.replace(/received string/, 'received text')
              : 'Select a valid option.') as string
          }
        </p>
      ) : null}
    </div>
  );
};

export function QueryField<T extends z.ZodObject<any>>({
  name,
}: FieldProps<T>) {
  const { metadata = {} } = useDynamicForm();
  const { register } = useFormContext();
  const fMetadata = metadata[name];
  if (!fMetadata || !metadata[name]?.query) {
    throw new Error('Query field missing query');
  }

  const query = fMetadata.query as Query;

  const { status, data } = useFirestoreCollectionData(query, { idField: 'id' });

  return status === 'loading' ? (
    <Spinner small />
  ) : (
    <select
      id={name}
      placeholder={(fMetadata.placeholder || name).split('.').pop()}
      multiple={fMetadata.multiple === true}
      {...register(name, { required: fMetadata.required || true })}
    >
      {data && data.length && <option value={undefined}>...</option>}
      {data &&
        data.map((instance) => {
          return (
            <option
              defaultChecked={
                fMetadata.selected
                  ? instance.id === fMetadata.selected
                  : undefined
              }
              key={instance.id}
              value={instance[fMetadata.value ?? 'id']}
            >
              {instance[fMetadata.display ?? 'id']}
            </option>
          );
        })}
    </select>
  );
}

export function QuerySearchField<T extends z.ZodObject<any>>({
  name,
}: FieldProps<T>) {
  const [instance, setInstance] = useState<DocumentData | DocumentData[]>();
  const [open, setOpen] = useState(false);
  const { metadata = {}, modifyFieldMeta } = useDynamicForm();
  const { setValue, trigger, watch, register } = useFormContext();
  const fmeta = metadata[name];
  const [defaultValue, setDefaultValue] = useState<string | undefined>();

  useEffect(() => {
    if (instance) {
      setOpen(false);
      setValue(
        name,
        Array.isArray(instance) ? instance.map((is) => is.id) : instance.id
      );
      fmeta?.onSelect &&
        fmeta.onSelect(instance, setValue, modifyFieldMeta as any);
    } else {
      setValue(name, Array.isArray(instance) ? [] : ('' as any));
    }
  }, [instance]);

  useEffect(() => {
    if (!defaultValue && watch(name)) {
      setDefaultValue(watch(name));
    }
  }, []);

  return (
    <div className="flex justify-between border-y items-center gap-3 py-1 w-full">
      <input
        type="hidden"
        {...register(name, {
          value:
            watch(name) ??
            (Array.isArray(instance)
              ? instance.map((is) => is.id)
              : instance?.id) ??
            undefined,
        })}
      />
      <span className="font-bold flex flex-col gap-1 text-sm">
        {instance && <span className="font-light">{toNormalCase(name)}</span>}
        <span>
          {instance
            ? Array.isArray(instance)
              ? instance
                  .map((is) => {
                    return is[fmeta?.display || 'id'];
                  })
                  .join(',')
              : instance[fmeta?.display || 'id']
            : toNormalCase(name)}
        </span>
      </span>
      <div className="flex items-center gap-1 py-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn border-blue text-xs p-2 flex items-center gap-1 "
        >
          {instance ? 'Change' : 'Choose'} {name}
          <MdArrowCircleRight />
        </button>
      </div>
      {
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={'Choose ' + name}
        >
          <Table
            columns={fmeta?.columns ?? ['name']}
            transform={(fmeta?.transform ?? {}) as CellTransform<DocumentData>}
            searchField={fmeta?.searchField ?? 'name'}
            defaultSelected={defaultValue}
            cantView={true}
            canSelectMultiple={fmeta?.multiple || false}
            onSelectInstance={(instances) => {
              setInstance(
                fmeta?.multiple
                  ? instances.filter((s) => s !== undefined)
                  : instances[0]
              );
            }}
            canSelect={true}
            collectionName={fmeta?.collectionName || name + 's'}
            collectionSingular={fmeta?.collectionNameSingular || undefined}
            query={fmeta?.query as Query}
            createForm={fmeta?.addForm || <p>No Add form available.</p>}
            getUpdateForm={
              fmeta?.getUpdateForm || (() => <p>No update form available.</p>)
            }
          />
        </Modal>
      }
    </div>
  );
}

export function MiniFormObjectArrayField<T extends ZodObject<any>>({
  name,
  objField,
}: FieldProps<T> & { objField: ZodObject<any> }) {
  const {
    formState: { errors },
  } = useFormContext();
  const { metadata = {} } = useDynamicForm();
  const { fields, remove, append, prepend } = useFieldArray({
    name: name,
  });
  const initFields = useRef(fields.length);

  const handleAddNew = useCallback(
    () =>
      append(
        metadata[name]?.initItem ??
          Object.keys(objField.shape).reduce((acc, k) => {
            acc[k] = '';
            return acc;
          }, {} as any)
      ),
    [metadata, objField]
  );

  useEffect(() => {
    if (initFields.current > 0) return;
    initFields.current = 1;
    handleAddNew();
  }, []);

  const deleteHandler = (i: number) => remove(i);

  return (
    <div className="p-2 border w-full rounded-md shadow-sm ">
      {fields.map((field, index) => (
        <div key={field.id} className=" flex items-end justify-between gap-2">
          {(
            Object.entries(objField.shape) as Array<[Path<TypeOf<T>>, ZodAny]>
          ).map(([fname, field]) => (
            <div key={`${name}.${index}.${fname}`}>
              <Field
                key={`${name}.${index}.${fname}`}
                field={field}
                name={`${name}.${index}.${fname}`}
              />
            </div>
          ))}
          <button
            type="button"
            className=" bg-red-400 icon-button-filled mb-2 hover:bg-red-500"
            onClick={() => deleteHandler(index)}
          >
            <MdClose />
          </button>
        </div>
      ))}

      <button
        onClick={() => handleAddNew()}
        className="btn p-1 pr-2 gap-1"
        type="button"
      >
        <MdAdd /> Add "{name}"
      </button>
    </div>
  );
}

export function NaNToZero(o: any) {
  Object.keys(o).forEach((k) => {
    if (Number.isNaN(o[k])) o[k] = 0;
  });
  return o;
}
