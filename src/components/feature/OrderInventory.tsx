import React, { useState } from 'react';
import { MdInventory } from 'react-icons/md';
import Table from '../Table';
import withAuthorization from '../hocs/withAuthorization';
import { useCustomAuth } from '../../context/Auth';
import { Inventory } from '../../database';
import { Query } from 'firebase/firestore';
import { useSalesContext } from '../../context/SalesContext';
import { InventoryItem, OrderItem } from '../../types';
import Modal from '../Modal';
import AddToCartForm from '../forms/sales/AddToCartForm';

const OrderInventory = () => {
  const { Branch } = useCustomAuth();
  const [instance, setInstance] = useState<OrderItem>();
  const invetoryQuery = Branch?.sub(Inventory).ref as Query;
  const { isTransfer } = useSalesContext();
  return (
    <div
      className={`flex border border-y-2 rounded flex-col w-full h-full ${
        isTransfer ? ' bg-blue-200/10 ' : ''
      }`}
    >
      <h3
        className={`flex items-center text-blue-900 ${
          isTransfer ? 'bg-blue-400 ' : ' bg-blue-600'
        } text-white font-bold border-b p-1 gap-3`}
      >
        <MdInventory className="w-6 h-6 ml-2" /> Choose Items
      </h3>
      <Modal
        onClose={() => setInstance(undefined)}
        open={!!instance}
        title={`Add "${instance?.itemName}" to cart`}
      >
        {instance && <AddToCartForm instance={instance as OrderItem} />}
      </Modal>

      <Table
        query={invetoryQuery}
        // defaultSelected={orderItems.map((oi) => oi.item)}
        cantAct={true}
        defaultSearchField="itemName"
        onSelectInstance={(instances) => setInstance(instances[0] as OrderItem)}
        collectionName="Inventory"
        orderBy={{ direction: 'asc', field: 'item' }}
        collectionSingular="Inventory"
        canSelect={true}
        cantView={true}
        columns={['itemName', 'quantity', 'taxCode', 'unitPrice']}
        maxCreate={0}
        createForm={<></>}
      />
    </div>
  );
};

export default withAuthorization({ requiredClaims: { manager: true } })(
  OrderInventory
);
