import { useState } from 'react';
import Modal from '../../components/Modal';
import OrderCart from '../../components/feature/OrderCart';
import OrderInventory from '../../components/feature/OrderInventory';
import SalesProvider from '../../context/SalesContext';
import cloudFunctionNames from '../../functionNames';
import {
  MdArrowCircleDown,
  MdArrowCircleUp,
  MdFireTruck,
  MdOpenInFull,
} from 'react-icons/md';
import { TransferPage } from '../transfers';
import { useCustomAuth } from '../../context/Auth';

const TransferPanel = () => {
  const [open, setOpen] = useState(false);
  const [transferType, setTransferType] = useState<'IN' | 'OUT'>('IN');
  const { transCount: count } = useCustomAuth();

  const contents = (
    <>
      {open && (
        <div className="text-sm mx-auto w-full font-medium text-center text-gray-500 border-b border-gray-200 ">
          <ul className="flex flex-wrap w-full -mb-px">
            <li>
              {['IN', 'OUT'].map((ts) => (
                <button
                  key={ts}
                  onClick={() => setTransferType(ts as any)}
                  className={
                    transferType !== ts
                      ? ` inline-block p-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300`
                      : `inline-block p-4 py-2 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active `
                  }
                >
                  Transfers {ts}
                </button>
              ))}
            </li>
          </ul>
        </div>
      )}
      <TransferPage transferType={transferType} />
    </>
  );

  return (
    <SalesProvider
      cloudFunctionName={cloudFunctionNames.confirmTransfer}
      cartId="cart1"
      localKey="transferData"
      isTransfer={true}
    >
      <div className="grid h-[90vh!important] flex-1 max-h-full  md:grid-cols-[1.4fr,2fr] mt-2 grid-rows-[1.5fr,1fr] gap-[2px]">
        <div className=" h-full overflow-auto rounded ">
          <OrderInventory />
        </div>
        <div className=" overflow-auto rounded">
          <OrderCart />
        </div>
        <div className="border h-64  col-span-2 flex flex-col">
          <h3
            className={`flex justify-between items-center stext-blue-900 bg-blue-200/70  ${
              true ? 'bg-blue-400 ' : ' bg-blue-600'
            } font-bold border-b p-1 text-white gap-3`}
          >
            <span className="flex items-center gap-2">
              <MdFireTruck className="w-6 h-6 ml-2" /> Transfers
              {count > 0 && (
                <span
                  className={`border border-red-400 rounded-full  h-6 w-6 flex justify-center items-center bg-red-100 text-red-500 font-extrabold `}
                >
                  {count}
                </span>
              )}
            </span>
            <button
              onClick={() => setOpen(true)}
              className="icon-button-filled py-1 gap-2  bg-blue-600 hover:bg-blue-700 text-white border-blue-400"
            >
              <MdOpenInFull />
              Expand
            </button>
          </h3>
          <div className="border-y flex items-center justify-between border-t-2 border-t-gray-500 w-full p-2">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  setTransferType('IN');
                }}
                className={`btn border text-green-500  hover:bg-green-700 hover:text-white border-green-500 ${
                  transferType === 'IN'
                    ? 'bg-green-600 text-[white!important]'
                    : ' bg-white '
                }`}
              >
                <MdArrowCircleDown /> IN-Transfers
              </button>
              <button
                onClick={() => {
                  setTransferType('OUT');
                }}
                className={`btn border text-blue-600 hover:bg-blue-700 hover:text-white border-blue-600 ${
                  transferType === 'OUT' ? 'bg-blue-600 text-white' : 'bg-white'
                }`}
              >
                <MdArrowCircleUp /> OUT-Transfers
              </button>
            </div>
          </div>

          {open && (
            <Modal
              title="Modern"
              modern={true}
              noTitle
              open={open}
              onClose={() => setOpen(false)}
            >
              {contents}
            </Modal>
          )}
          {!open && contents}
        </div>
      </div>
    </SalesProvider>
  );
};

export default TransferPanel;
