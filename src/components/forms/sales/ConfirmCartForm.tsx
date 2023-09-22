import { useEffect, useState } from "react";
import { z } from "zod";
import { getCodeEnums } from "../ItemsCreateForm";
import { paymentMethodCodes } from "../../../data/itemCodesData";
import DynamicForm from "../Form";
import { SubmitHandler } from "react-hook-form";
import { getOptions } from "../PurchaseForm";
import { useSalesContext } from "../../../context/SalesContext";
import toRwf from "../../../helpers/toRwf";
import { MdClose, MdEdit, MdSave, MdVerified } from "react-icons/md";
import Modal from "../../Modal";
import OrderCustomers from "../../feature/OrderCustomers";
import Spinner from "../../Spinner";
import { toast } from "react-hot-toast";
import { useModalContext } from "../../../context/ModalContext";



const ConfirmCartForm = () => {
  const {
    orderItemsCost,
    costAfterDiscount,
    payInfo,
    totalQuantity,
    customer,
    handleConfirmSale,
    checkCustomerFillables,
    changePayInfo,
    customerEmpties,
    
    willPayCaution,
    
  } = useSalesContext();
  const confirmCartSchema = z.object({
    empties: z.number().min(0).default (totalQuantity - customerEmpties),
    caution: z.number().min(0).default(0),
    payMethod: z.enum(getCodeEnums(paymentMethodCodes)),
    payDate: z.date().or(z.string()).default(""),
    payAmount: z.number().min(0).default(0),
    discount: z.number().min(0).max(100).default(0),
  });
  const [showCustomers, setShowCustomers] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [formReady, setFormReady] = useState(false);

  const handlePayData: SubmitHandler<z.infer<typeof confirmCartSchema>> = (
    data
  ) => {
    changePayInfo(data);
    if (!formReady) setFormReady(true);
    else setConfirmOpen(true);
    if (!customer) return setShowCustomers(true);
    // setConfirmOpen(true);
  };
  const { handleClose } = useModalContext();

  useEffect(() => {
    checkCustomerFillables().then(([canSave, msg]) => {
      formReady && setConfirmOpen(true);
      setCanSave(canSave);
      setMsg(msg);
    });
  }, [checkCustomerFillables, formReady, totalQuantity, customer]);

  const confirmParam = {
    loading: (
      <div className="flex items-center gap-2 p-1">
        <span className="text-gray-500">Confirming sale...</span>
      </div>
    ),
    success: () => {
      setFormReady(false);
      setConfirmOpen(false);
      setShowCustomers(false);
      handleClose();
      return "Sale was applied succesfully!";
    },
    error: (e: any) => {
      return (
        <div className="flex gap-2 p-1 flex-col">
          <p>Error occured, Sale was not completed.</p>
          <p className="text-red-500 test-sm">{e?.message}</p>
        </div>
      );
    },
  };

  return (
    <div className="flex flex-col gap-2">
      {confirmOpen && (
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={"Confirm Sale"}
        >
          {!canSave && !msg && <Spinner />}
          {!canSave && msg && (
            <div className="flex border bg-red-300/30 mx-auto max-w-[400px] rounded p-3 gap-2 flex-col my-5 text-lg font-semibold">
              <span className="text-xl mb-3 text-red-700 font-bold capitalize">
                Attention{" "}
              </span>
              <p className=" text-red-500 ">{msg}</p>
            </div>
          )}
          {canSave && (
            <div>
              <p className="text-lg font-bold flex gap-3 flex-col">
                <span>Are you ready to confirm this sale?</span>
                <span className="font-bold text-red-400  mb-10">
                  {" "}
                  You can't edit it later.
                </span>
              </p>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => {
                    toast.promise(handleConfirmSale(), confirmParam);
                  }}
                  className="btn bg-green-500 hover:bg-green-700"
                >
                  <MdVerified /> Confirm now
                </button>
                <button onClick={() => setConfirmOpen(false)} className="btn ">
                  <MdClose /> Save only
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
      {
        <Modal
          title="Choose Customer"
          open={showCustomers}
          onClose={() => setShowCustomers(false)}
        >
          {showCustomers && <OrderCustomers />}
        </Modal>
      }
      <div className="flex font-bold text-lg border-y-1 py-1 gap-2">
        <div className="flex flex-col border-r px-2 gap-1">
          <span className="font-bold border-b text-blue-700">
            Total Amount{" "}
          </span>
          <span className="font-mono">{toRwf(orderItemsCost)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold border-b text-blue-700">
            Tot. After Discount
          </span>
          <span className="font-mono">{toRwf(costAfterDiscount)}</span>
        </div>
      </div>

      <div className="flex font-bold justify-between  text-lg border-y py-1 gap-2">
        <div className="">
          <span className="font-bold text-blue-700">Customer: </span>
          {customer?.name && <span>{customer.name}</span>}
        </div>
        <button
          onClick={() => setShowCustomers(true)}
          type="button"
          title="Change"
          className="border-2 hover:text-white hover:bg-blue-500 border-blue-400 text-blue-500 font-bold text-xl rounded-full p-1 h-8 flex items-center justify-center w-8"
        >
          <MdEdit className="text-sm" />
        </button>
      </div>

      <DynamicForm
        onSubmit={(data) => handlePayData(data as any)}
        instance={payInfo ?? undefined}
        action={
          <>
            <MdSave /> Save
          </>
        }
        schema={confirmCartSchema.extend({
          // discount: z
          //   .number()
          //   .min(0)
          //   .max(100)
          //   .default(
          //     customer?.defaultDiscount
          //       ? Number(
          //           ((customer.defaultDiscount * 100) / orderItemsCost).toFixed(
          //             2
          //           )
          //         )
          //       : 0
          //   ),
        })}
        metadata={{
          discount: {
            hidden: true,
            watchFields: ["discount"],
            calculate: ({ value }) => {
              changePayInfo({ ...payInfo, discount: value as number });
            },
            helpText: "Percentage(%) discount on all products on the cart.",
          },
          payMethod: {
            options: getOptions({
              choices: paymentMethodCodes,
              display: "codeName",
              hidden: "code",
            }),
          },
          empties: {
            hidden: !willPayCaution,
            
          },
          caution: {
            hidden: !willPayCaution,
          },
          payAmount: {
            watchFields: ["payMethod"],
            calculate({ fields, modifyFieldMeta, setValue }) {
              const [method] = fields;
              if (!["02", "03"].includes(method)) {
                modifyFieldMeta("payAmount", { hidden: true });
                setValue("payAmount", 0);
              } else {
                modifyFieldMeta("payAmount", { hidden: false });
              }
            },
            helpText: "Initial payment in case of credit, default is zero.",
          },
          payDate: {
            watchFields: ["payMethod"],
            calculate({ fields, modifyFieldMeta, setValue }) {
              const [method] = fields;
              if (!["02", "03"].includes(method)) {
                modifyFieldMeta("payDate", { hidden: true });
                setValue("payDate", "");
              } else {
                modifyFieldMeta("payDate", { hidden: false });
              }
            },
            helpText: "Date initial payment was or will be made.",
          },
        }}
      />
    </div>
  );
};

export default ConfirmCartForm;
