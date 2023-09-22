import { useEffect, useState } from 'react';
import { Inventory as InventoryType } from '../../types';
import { MdAdd, MdCheckCircle } from 'react-icons/md';
import LocationProvider, {
  useLocationContext,
} from '../../context/LocationContext';
import Spinner from '../Spinner';
import { Branches, Companies, Inventory } from '../../database';
import { toast } from 'react-hot-toast';
import { useFirestoreDocData } from 'reactfire';

const ViewInventoryPage = ({
  inventory: initialInventory,
}: {
  inventory: InventoryType;
}) => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState(initialInventory);
  const { saveTree, lTree } = useLocationContext();
  const invDoc = Companies.doc(inventory.path.companies)
    .sub(Branches)
    .doc(inventory.path.branches)
    .sub(Inventory)
    .doc(inventory.id);
  const { status, data: _inventory } = useFirestoreDocData(invDoc.ref, {
    idField: 'id',
  });

  useEffect(() => {
    if (!_inventory) return;
    setInventory(_inventory as InventoryType);
  }, [_inventory]);

  const handleUseLocation = async (path: string, freeSpace: number) => {
    let remaningAfterAllocation = inventory.unAllocated - freeSpace;
    const qtySaved =
      remaningAfterAllocation > 0 ? freeSpace : inventory.unAllocated;
    if (
      !lTree.storeItemsToPath(path, [
        { item: inventory.item, quantity: qtySaved },
      ])
    ) {
      return toast.error('Inventory allocation failed. Unexpected error!');
    }

    setLoading(true);
    let newLocations = inventory.locations || [];
    if (newLocations.some((l) => l.path === path)) {
      newLocations[newLocations.findIndex((l) => l.path === path)].quantity +=
        qtySaved;
    } else {
      newLocations.push({ path, quantity: qtySaved });
    }
    invDoc
      .save({
        unAllocated: remaningAfterAllocation > 0 ? remaningAfterAllocation : 0,
        locations: newLocations,
      })
      .then((re) => {
        setLoading(false);
        toast.success('Inventory allocation was successful!');
      })
      .catch((e) => {
        setLoading(false);
        toast.error('Inventory allocation failed! ' + e.message);
      });
    saveTree();
  };

  return (
    <div>
      <h3 className="font-bold text-2xl">{inventory.itemName}</h3>
      <div className="flex flex-col gap-1">
        <p
          className={`mb-2 text-sm font-bold ${
            inventory.unAllocated === 0 ? 'text-green-500' : 'text-red-400'
          } flex items-center gap-2 border-y my-3`}
        >
          {inventory.unAllocated === 0 ? (
            <>
              {' '}
              <MdCheckCircle /> All quantities are allocated
            </>
          ) : (
            <>
              {' '}
              <span className="font-bold p-1 m-1 rounded-full border w-10 h-10 flex items-center justify-center text-lg">
                {inventory.unAllocated}
              </span>{' '}
              Unallocated quantity
            </>
          )}
        </p>

        {inventory.unAllocated > 0 && (
          <h4 className="text-lg font-bold border-b">Available Locations</h4>
        )}
        {inventory.unAllocated > 0 &&
          lTree.availableLocations().length === 0 && (
            <p className="text-sm font-bold border-b">No free space.</p>
          )}
        {inventory.unAllocated > 0 &&
          lTree.availableLocations().map((location) => (
            <div
              key={location.path}
              className="flex items-center justify-between p-1 border-y gap-2 "
            >
              <span>
                {location.name} -{' '}
                <span className="text-xs">Capacity of {location.capacity}</span>
              </span>
              {loading || status === 'loading' ? (
                <Spinner small />
              ) : (
                <button
                  onClick={() =>
                    handleUseLocation(location.path, location.capacity)
                  }
                  className="btn p-1 pr-2 gap-0 border-blue-500 border bg-blue-300 text-blue-600 hover:text-white"
                >
                  <MdAdd className="p-0 mr-[2px]" /> Use
                </button>
              )}
            </div>
          ))}
        <h4 className="text-lg font-bold border-b">Storage Locations</h4>
        {inventory.locations &&
          inventory.locations.map((al) => (
            <div
              key={al.path + al.quantity}
              className="flex flex-col ml-2 p-1 gap-2 "
            >
              <p className="border-b w-full flex gap-2">- Path: {al.path}</p>
              <p className="border-b w-full flex gap-2">
                - Qantity: {al.quantity}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

const ViewInventory = ({ inventory }: { inventory: InventoryType }) => {
  return (
    <LocationProvider>
      <ViewInventoryPage inventory={inventory} />
    </LocationProvider>
  );
};

export default ViewInventory;
