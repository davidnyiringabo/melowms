import { useEffect, useState } from 'react';
import {
  OrderItem,
  PropsWithInstace,
  Transfer,
  TransferItem,
} from '../../types';
import { MdPadding, MdClose, MdVerified, MdRecycling } from 'react-icons/md';
import toRwf from '../../helpers/toRwf';
import { useModalContext } from '../../context/ModalContext';
import Modal from '../Modal';
import AcceptItemForm from '../forms/sales/AcceptItemsForm';
import RejectItemsForm from '../forms/sales/RejectItemsForm';
import { useViewTransfer } from '../../context/ViewTransferContext';
import RestockItemForm from '../forms/sales/RestockItemForm';

type ActionType = 'Reject' | 'Accept' | 'Restock';

const ViewTransfer = ({}: PropsWithInstace<unknown>) => {
  const { changeSize } = useModalContext();
  const [actionType, setActionType] = useState<ActionType>();
  const [prevAction, setPrevAction] = useState<ActionType>();
  const [canHop, setCanHop] = useState(false);
  const [item, setItem] = useState<TransferItem>();
  const { isIn, transfer } = useViewTransfer();
  const [instance, setInstance] = useState(transfer);

  useEffect(() => {
    setInstance(transfer);
    setItem(instance.items.find((it) => it.item === item?.item));
  }, [transfer, transfer.items]);

  useEffect(() => {
    if (!prevAction || prevAction === 'Restock' || !canHop) return;
    // No untouched Qty left
    if (
      (instance.items.find((it) => it.item === item?.item)?.untouchedQty ??
        0) <= 0
    )
      return;

    if (prevAction === 'Accept') {
      setActionType('Reject');
    } else if (prevAction === 'Reject') {
      setActionType('Accept');
    }
    setCanHop(false);
  }, [instance, canHop, item, prevAction]);

  useEffect(() => {
    changeSize('lg');
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <h4 className="pb-2 border-b">
        Transfer from{' '}
        <span className="font-semibold">"{instance.fromBranch}"</span> to{' '}
        <span className="font-semibold">"{instance.toBranch}"</span>
      </h4>
      {!!prevAction && (
        <Modal
          open={!!prevAction}
          title="Continue"
          onClose={() => {
            setPrevAction(undefined);
            setCanHop(false);
          }}
        >
          <div className="flex w-full p-2 border shadow-sm rounded items-center justify-center">
            <button
              onClick={() => setCanHop(true)}
              className={`btn ${
                prevAction === 'Accept'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              Go to {prevAction === 'Reject' ? 'Accept' : 'Reject'}
            </button>
          </div>
        </Modal>
      )}
      {item && (
        <Modal
          title={`${actionType} '${item.itemName}'`}
          open={!!actionType}
          onClose={() => {
            if (
              (actionType === 'Accept' || actionType === 'Reject') &&
              (item.untouchedQty ?? item.quantity) > 0
            ) {
              setPrevAction(actionType);
            }
            setActionType(undefined);
          }}
        >
          {actionType === 'Restock' && <RestockItemForm instance={item} />}
          {actionType === 'Accept' && <AcceptItemForm instance={item} />}
          {actionType === 'Reject' && <RejectItemsForm instance={item} />}
        </Modal>
      )}

      <table>
        <thead className="border-b">
          <tr>
            <th className="text-start">
              <span className="font-semibold"></span>
            </th>
            <th className="border-1 text-xs font-bold rounded p-2">Qty</th>
            <th className="border-1 text-xs font-bold rounded text-green-500 p-2">
              Accepted
            </th>
            <th className="border-1 text-xs font-bold rounded p-2 text-red-500">
              Rejected
            </th>
            <th className="border-1 font-mono  text-xs font-bold rounded p-2">
              Unit.Price
            </th>
            <th className="border-1 font-mono  text-xs font-bold rounded p-2">
              Tot.Amnt
            </th>
            {!isIn && (
              <th>
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    title="Change"
                    className="border-1 text-xs hover:border-blue-500 border-blue-400 text-blue-500 font-bold rounded px-1 flex items-center justify-center"
                  >
                    Re-stock
                  </button>
                </div>
              </th>
            )}
            {isIn && (
              <>
                <th>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      title="Change"
                      className="border-1 text-xs hover:border-blue-500 border-blue-400 text-blue-500 font-bold rounded px-1 flex items-center justify-center"
                    >
                      Accept
                    </button>
                  </div>
                </th>
                <th>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      title="Remove"
                      className="border-1 text-xs  border-red-400 text-red-500 font-bold rounded px-1 flex items-center justify-center"
                    >
                      Reject
                    </button>
                  </div>
                </th>
              </>
            )}
          </tr>
        </thead>

        <tbody className="">
          {instance.items.length === 0 && (
            <tr className="[all:unset] p-[1rem!important] [display:flex!important] [justify-items:center] my-[.5rem!important] mx-[auto!important]  items-center font-light text-lg text-center w-[100%!imporant] ">
              No items in the cart. Select from the left side.
            </tr>
          )}
          {instance.items.map((oi) => (
            <tr className="border-b" key={oi.item}>
              <td>
                <div className="flex gap-1 p-1 items-center">
                  <MdPadding />
                  <span className="font-semibold">{oi.itemName}</span>
                </div>
              </td>
              <td className="text-center font-bold rounded p-2">
                {oi.quantity}
              </td>
              <td className="text-center font-bold rounded p-2">
                {oi.acceptedQty ?? 0}
              </td>
              <td className="text-center font-bold rounded p-2">
                {oi.totRejected ?? 0}
              </td>
              <td className="text-center font-mono font-bold rounded p-2">
                {toRwf(oi.unitPrice)}
              </td>
              <td className="text-center font-mono font-bold rounded p-2">
                {toRwf(oi.totalPrice)}
              </td>
              {!isIn && (oi.totRejected ?? 0) > 0 && (
                <td>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => {
                        setActionType('Restock');
                        setItem(oi);
                      }}
                      type="button"
                      title="Change"
                      className="text-center hover:text-white justify-self-center self-center hover:bg-blue-500 border-blue-400 text-blue-500 font-bold text-xl rounded-full p-2 h-8 flex items-center justify-center w-8"
                    >
                      <MdRecycling className="w-20 h-20" />
                    </button>
                  </div>
                </td>
              )}
              {isIn && (
                <>
                  <td>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setActionType('Accept');
                          setItem(oi);
                        }}
                        type="button"
                        title="Change"
                        className="text-center hover:text-white justify-self-center self-center hover:bg-blue-500 border-blue-400 text-blue-500 font-bold text-xl rounded-full p-2 h-8 flex items-center justify-center w-8"
                      >
                        <MdVerified className="w-20 h-20" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setActionType('Reject');
                          setItem(oi);
                        }}
                        type="button"
                        title="Remove"
                        className="text-center hover:text-white self-center justify-self-center hover:bg-red-500 border-red-400 text-red-500 font-bold text-xl rounded-full p-2 h-8 flex items-center justify-center w-8"
                      >
                        <MdClose className="w-20 h-20" />
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewTransfer;
