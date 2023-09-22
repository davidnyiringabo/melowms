import {
  useForm,
  DeepPartial,
  FormProvider,
  useFormContext,
  Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TypeOf } from "zod";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import DyamicFormContext, {
  DynamicFormProps,
  FieldMetadata,
  FieldsMetadata,
  useDynamicForm,
} from "../../context/DynamicFormContext";
import useFormFields from "../../hooks/useFormFields";
import { useModalContext } from "../../context/ModalContext";
import Modal from "../Modal";

export default function DynamicForm<T extends z.ZodObject<any>>({
  onSubmit,
  metadata,
  refineCallbacks,
  instance,
  action,
  onFieldsChange,
  multiLevel,
  inputsPerLevel,
  schema: initSchema,
  ...props
}: DynamicFormProps<T>): JSX.Element {
  const [schema, setSchema] = useState(initSchema);
  const schemaWithEffects = refineCallbacks?.reduce((acc, refineCallback) => {
    return acc.refine(
      refineCallback.fn as any,
      refineCallback.args as any
    ) as any;
  }, schema);
  const [meta, setMeta] = useState<FieldsMetadata<typeof schema>>(
    metadata ?? {}
  );

  const methods = useForm<z.infer<T>>({
    values: instance
      ? ({ ...transformInstanceDates(instance) } as DeepPartial<TypeOf<T>>)
      : undefined,
    resolver: zodResolver(schemaWithEffects ?? schema),
  });

  const modifyFieldMeta = <T extends z.ZodObject<any>>(
    name: Path<TypeOf<T>>,
    fMeta: FieldMetadata<T>
  ) => {
    setMeta((mt) => ({ ...mt, [name]: { ...mt[name], ...fMeta } }));
  };

  useEffect(() => {
    setSchema(initSchema);
  }, [initSchema]);

  useEffect(() => {
    if (props.onSchemaChange) {
      props.onSchemaChange(methods.setValue);
    }
  }, [schema]);

  return (
    <DyamicFormContext.Provider
      value={{
        ...props,
        schema,
        action,
        multiLevel,
        inputsPerLevel,
        metadata: meta as any,
        modifyFieldMeta,
        onFieldsChange,
        instance,
        onSubmit,
      }}
    >
      {props.isMini ? (
        <_DyamicForm />
      ) : (
        <FormProvider {...methods}>
          <_DyamicForm />
        </FormProvider>
      )}
    </DyamicFormContext.Provider>
  );
}

export function _DyamicForm(): JSX.Element {
  const { isOpen, handleClose } = useModalContext();
  const {
    onSubmit,
    schema,
    action,
    className = "",
    autoSave,
    instance,
    multiLevel,
    inputsPerLevel,
    additionValidationModal,
    updateString,
    additionValidation,
  } = useDynamicForm();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isMutliLevel] = useState(!!multiLevel && !!inputsPerLevel);
  const [isLastLevel, setIsLastLevel] = useState(false);
  const [validating, setValidating] = useState(false);
  const {
    handleSubmit,
    clearErrors,
    watch,
    trigger,
    reset,
    formState: { isDirty, isSubmitSuccessful, isSubmitted, isSubmitting },
  } = useFormContext();

  const allFields = watch();

  const saveForm = async () => {
    // handleSubmit(onSubmit);
    if (isDirty && onSubmit) (await trigger()) && onSubmit(allFields);
  };

  const [stillSubmitting, setStillSubmitting] = useState(true);

  useEffect(() => {
    if (isSubmitSuccessful && !stillSubmitting) {
      reset();
      isOpen && !action && handleClose();
    }
  }, [isSubmitSuccessful, reset, stillSubmitting]);

  const fields = useFormFields();

  useEffect(
    () =>
      setIsLastLevel(
        isMutliLevel &&
          currentLevel >= Math.floor(fields.length / (inputsPerLevel as number))
      ),
    [isMutliLevel, currentLevel, inputsPerLevel, fields]
  );

  const [message, setMessage] = useState<string>();

  const handleNextLevel = async () => {
    const currentFields = Object.entries(schema.shape)
      .map(([name]) => name)
      .slice(
        currentLevel * (inputsPerLevel as number),
        (currentLevel + 1) * (inputsPerLevel as number)
      );

    const isValid = await trigger(currentFields);
    if (isValid) {
      clearErrors();
      setCurrentLevel(currentLevel + 1);
    }
  };
  const handlePrevLevel = () => {
    setCurrentLevel(currentLevel - 1);
  };

  const [open, setOpen] = useState(false);

  return (
    <div
      className="flex form gap-2  p-2 mx-auto pt-4 my-2 flex-col max-w-[400px] w-full"
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onBlur={async () => autoSave && saveForm()}
    >
      {isMutliLevel && inputsPerLevel
        ? fields.slice(
            currentLevel * inputsPerLevel,
            (currentLevel + 1) * inputsPerLevel
          )
        : fields}
      {validating && (
        <div className=" items-center justify-center flex">
          <Spinner />
        </div>
      )}
      <Modal
        title="Confirm"
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        {additionValidationModal && additionValidationModal(message ?? "")}
        <div className="flex items-center">
          <button
            className="btn bg-red-500 hover:bg-red-600"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
      {isMutliLevel && (
        <div className="flex gap-2 justify-between items-center">
          <button
            disabled={currentLevel == 0 || isSubmitting}
            onClick={handlePrevLevel}
            className="btn mt-3"
            type="button"
          >
            Back
          </button>
          {isLastLevel ? (
            <button
              onClick={async (e) => {
                handleSubmit(async (data) => {
                  if (additionValidation) {
                    setValidating(true);
                    const validationData = await additionValidation(allFields);
                    setValidating(false);
                    if (!validationData.status) {
                      setOpen(true);
                      setMessage(validationData.message);
                      return;
                    }
                    setMessage(undefined);
                  }
                  await onSubmit(data);
                  setStillSubmitting(false);
                })(e);
              }}
              disabled={isSubmitting}
              className="btn mt-3"
              type="button"
            >
              {isSubmitting && !isSubmitted && <Spinner small />}
              {action ? action : instance ? "Update" : "Submit"}
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={handleNextLevel}
              className="btn mt-3"
              type="button"
            >
              Next
            </button>
          )}
        </div>
      )}

      {!isMutliLevel && !autoSave && (
        <button
          onClick={async (e) => {
            handleSubmit(async (data) => {
              if (additionValidation) {
                setValidating(true);
                const validationData = await additionValidation(allFields);
                setValidating(false);
                if (!validationData.status) {
                  setOpen(true);
                  setMessage(validationData.message);
                  return;
                }
                setMessage(undefined);
              }
              await onSubmit(data);
              setStillSubmitting(false);
            })(e);
          }}
          disabled={isSubmitting}
          className={`btn mt-3 ${className}`}
          type="button"
        >
          {isSubmitting && !isSubmitted && <Spinner small />}
          {action ? action : instance ? updateString || "Update" : "Submit"}
        </button>
      )}
    </div>
  );
}

export function pascalCase(input: string): string {
  return input.replace(/(\w)(\w*)/g, function (g0, g1, g2) {
    return g1.toUpperCase() + g2.toLowerCase();
  });
}

export function transformInstanceDates<T extends { [k: string]: any }>(
  instance: T
) {
  const newInstance = { ...instance };
  Object.keys(instance).forEach((k: keyof T) => {
    if (typeof instance[k]?.toDate === "function") {
      newInstance[k] = newInstance[k].toDate().toISOString().substring(0, 10);
    }
  });
  return newInstance;
}
