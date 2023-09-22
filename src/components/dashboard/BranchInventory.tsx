import { useCustomAuth } from '../../context/Auth';
import { TotalCalc } from '../../context/TableContext';
import { Companies, Branches, Inventory } from '../../database';
import toRwf from '../../helpers/toRwf';
import { Branch, Inventory as InvType } from '../../types';
import Table from '../Table';

export default function BranchInventory({ branch }: { branch: Branch }) {
  const { tinnumber } = useCustomAuth();
  const inventoryQuery = Companies.doc(tinnumber as string)
    .sub(Branches)
    .doc(branch.id)
    .sub(Inventory).ref;

  const totalCalc: TotalCalc<InvType> = (data) => {
    return [
      {
        totalName: 'Total Stock Value',
        important: true,
        value: data.reduce(
          (acc, curr) => acc + curr.unitPrice * curr.quantity,
          0
        ),
      },
    ];
  };

  return (
    <div>
      <Table
        query={inventoryQuery}
        hasTotals
        totalCalc={totalCalc}
        orderBy={{ direction: 'asc', field: 'item' }}
        columns={['itemName', 'quantity', 'unitPrice', 'total']}
        transform={{ total: (r) => toRwf(r.quantity * r.unitPrice) }}
        maxCreate={0}
        cantAct={true}
        createForm={<></>}
        collectionName={Inventory.name}
        collectionSingular={Inventory.name}
      />
    </div>
  );
}
