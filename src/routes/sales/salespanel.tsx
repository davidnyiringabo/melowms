import React from 'react';
import OrderCart from '../../components/feature/OrderCart';
import OrderCustomers from '../../components/feature/OrderCustomers';
import OrderInventory from '../../components/feature/OrderInventory';
import SalesProvider from '../../context/SalesContext';
import cloudFunctionNames from '../../functionNames';
import { OrdersPage } from '../orders';
import { MdMoney } from 'react-icons/md';

const SalesPanelPage = () => {
  return (
    <SalesProvider
      cloudFunctionName={cloudFunctionNames.confirmSale}
      cartId="cart0"
      localKey="salesData"
      isTransfer={false}
    >
      <div className="grid h-[85vh!important]  md:grid-cols-[1.4fr,2fr] mt-2 gap-[2px] grid-rows-[1.5fr,1fr]">
        <div className=" h-full overflow-auto rounded ">
          <OrderInventory />
        </div>
        <div className="border  overflow-auto  rounded">
          <OrderCart />
        </div>
        <div className="border h-64  col-span-2 flex flex-col">
          <OrdersPage />
        </div>
      </div>
    </SalesProvider>
  );
};

export default SalesPanelPage;
