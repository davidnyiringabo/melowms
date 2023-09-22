import React, { useContext, useEffect, useState } from 'react';
import LocationTree, {
  ExportObject,
  LocationMap,
  LocationName,
  LocationNode,
} from '../helpers/locationTree';
import { Mutable } from '../types';
import { toast } from 'react-hot-toast';
import { useCustomAuth } from './Auth';
import { DocNode, Locations } from '../database';
import { useFirestoreCollectionData } from 'reactfire';
import withAuthorization from '../components/hocs/withAuthorization';
import Spinner from '../components/Spinner';

const initialPath: Mutable<LocationMap> = {
  [LocationName.ROOT]: '',
  [LocationName.WAREHOUSE]: '',
  [LocationName.AREA]: '',
  [LocationName.ROW]: '',
  [LocationName.BAY]: '',
  [LocationName.LEVEL]: '',
  [LocationName.POSITION]: '',
};

export type NodeData = {
  name: string;
  capacity: number;
  quantity: number;
  lastLevel?: LocationName;
};

const LocationContext = React.createContext<{
  lTree: LocationTree;
  changes: number;
  saveTree: () => void;
  resetTree: () => void;
  modifyLTree: (
    action: 'Add' | 'Update' | 'Remove',
    node: LocationNode,
    data?: NodeData
  ) => void;
  activePath: Mutable<LocationMap>;
  changePathKey: (node: LocationNode) => void;
}>({
  lTree: new LocationTree(),
  saveTree: () => undefined,
  resetTree: () => undefined,
  changes: 0,
  modifyLTree: (
    action: 'Add' | 'Update' | 'Remove',
    node: LocationNode,
    data?: NodeData
  ) => undefined,
  activePath: initialPath,
  changePathKey: () => undefined,
});

export const useLocationContext = () => useContext(LocationContext);

const _LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isManager, Branch } = useCustomAuth();
  const [changes, setChanges] = useState(0);
  const [activePath, setActivePath] =
    useState<Mutable<LocationMap>>(initialPath);
  const [lTree, setLTree] = useState<LocationTree>(new LocationTree());
  const [shouldRerender, setShouldRerender] = useState<boolean>(false);

  const { status, data: treeArray } = useFirestoreCollectionData(
    (Branch as DocNode).sub(Locations).ref,
    { idField: 'id' }
  );

  useEffect(() => {
    if (treeArray && treeArray.length) {
      setLTree(LocationTree.toTree(treeArray[0] as ExportObject));
      setChanges(0);
    }
  }, [treeArray]);

  const resetTree = () => {
    if (treeArray && treeArray.length) {
      setLTree(LocationTree.toTree(treeArray[0] as ExportObject));
    } else {
      setLTree(new LocationTree());
    }
    setChanges(0);
  };

  const changePathKey = (node: LocationNode) => {
    setActivePath({ ...node.lpath } as Mutable<LocationMap>);
  };

  const saveTree = () => {
    if (!isManager)
      return toast.error('Currently managers can save locatin info.');
    Branch?.sub(Locations)
      .doc('locations')
      .save(lTree.toObject())
      .then((_r) => {
        toast.success('Allocation information saved');
        setChanges(0);
      })
      .catch((e) => {
        toast.error('Saving information failed. ' + e.message);
      });
  };

  const modifyLTree = (
    action: 'Add' | 'Update' | 'Remove',
    node: LocationNode,
    data?: NodeData
  ) => {
    if (action !== 'Remove' && !data) return;
    switch (action) {
      case 'Add':
        const newNode = node.addChild((data as NodeData).name);
        if (!newNode) {
          return toast.error(
            `${node.getNextLevel()} with name "${
              (data as NodeData).name
            }" alreay exists.`
          );
        }

        newNode.capacity = (data as NodeData).capacity || 0;
        // newNode.quantity = (data as NodeData).quantity || 0;
        if (data?.lastLevel) {
          newNode.lastLevel = (data as NodeData).lastLevel as LocationName;
        }

        break;
      case 'Update':
        if ((data as NodeData).lastLevel) {
          if (node.lastLevelSet) {
            return toast.error('Last location can only be set once.');
          }
          node.lastLevel = (data as NodeData).lastLevel as LocationName;
        }
        const newCapacity = (data as NodeData).capacity;
        if (node.level === node.lastLevel) {
          if (newCapacity < node.quantity) {
            return toast.error(
              `The capacity you're setting is smaller than existing quantity. You need to remove "${
                node.quantity - newCapacity
              }" quantity first.`
            );
          }

          node.capacity = (data as NodeData).capacity;
          // node.quantity = (data as NodeData).quantity;
        }
        if (
          node.parent &&
          node.parent.children.filter((c) => c.name === (data as NodeData).name)
            .length < 2
        )
          node.name = (data as NodeData).name;
        else
          toast.error(
            `${node.getNextLevel()} with name "${
              (data as NodeData).name
            }" alreay exists.`
          );
        break;
      case 'Remove':
        if (node.quantity > 0) {
          node.quantity -= node.quantity;
        }
        node.capacity -= node.capacity;
        node.remove();
    }
    setChanges((p) => p + 1);
    setShouldRerender((p) => !p);
    // setLTreeObj(lTree.toObject());
  };

  return status === 'loading' ? (
    <Spinner />
  ) : (
    <LocationContext.Provider
      value={{
        changes,
        modifyLTree,
        saveTree,
        resetTree,
        lTree: shouldRerender ? lTree : lTree,
        activePath,
        changePathKey,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

const LocationProvider = withAuthorization({
  requiredClaims: { superAdmin: false, manager: true },
  all: false,
})(_LocationProvider);
export default LocationProvider;
