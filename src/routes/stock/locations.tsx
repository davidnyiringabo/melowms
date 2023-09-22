import DynamicForm from '../../components/forms/Form';
import Modal from '../../components/Modal';
import { useEffect, useState } from 'react';
import {
  MdAdd,
  MdDeleteForever,
  MdInfo,
  MdRestartAlt,
  MdVerified,
} from 'react-icons/md';
import { z } from 'zod';
import LocationProvider, {
  NodeData,
  useLocationContext,
} from '../../context/LocationContext';
import LocationTree, {
  DEFAULT_LAST_POSITION,
  LocationName,
  LocationNode,
} from '../../helpers/locationTree';
import { SubmitHandler } from 'react-hook-form';
import LocationGenerator from '../../components/feature/LocationGenerator';
import { useNavigate } from 'react-router-dom';

const LocationPreview = () => {
  const { lTree } = useLocationContext();
  return (
    <div className="flex gap-2 flex-col">
      <div className="flex mt-2 justify-between">
        <div className="flex items-center gap-2">
          <LocationGenerator />
        </div>
        <SaveLocations />
      </div>
      <div className="flex flex-wrap p-1 items-center gap-2">
        <p className="py-1 border-gray-500 border-y ">
          Total quantity: {lTree.root.quantity}
        </p>
        <p className="py-1 border-gray-500 border-y ">
          Total capacity: {lTree.root.capacity}
        </p>
        <p className="py-1 border-gray-500 border-y ">
          Total free space: {lTree.root.capacity - lTree.root.quantity}
        </p>
      </div>
      <OpenLocationPath />
      <div className="flex  transition-all  overflow-x-auto max-w-full w-full p-2 my-1 shadow-md rounded border gap-2">
        {<LocationNodeComponent node={lTree.root} />}
        {/* <pre>{JSON.stringify(lTree.toObject(), null, 2)}</pre> */}
      </div>
    </div>
  );
};

const newNodeSchema = z.object({
  name: z.string().trim().min(1),
});

const LocationNodeComponent = ({ node }: { node: LocationNode }) => {
  const [children, setChildren] = useState<LocationNode[]>(node.children);
  const { activePath } = useLocationContext();

  useEffect(() => {
    setChildren(node.children);
  }, [node.children]);

  return (
    <>
      <ChildNodesComponent node={node} />

      {node.getNextLevel() != (node.lastLevel || DEFAULT_LAST_POSITION) &&
        children.map(
          (child) =>
            child.lpath[child.level] === activePath[child.level] && (
              <LocationNodeComponent key={child.name} node={child} />
            )
        )}
    </>
  );
};

const ChildNodesComponent = ({ node }: { node: LocationNode }) => {
  const [open, setOpen] = useState(false);
  const [update, setUpdate] = useState<LocationNode | null>(null);
  const { activePath, changePathKey, modifyLTree } = useLocationContext();
  const handleMakeActive = (node: LocationNode) => {
    changePathKey(node);
  };

  const [, level1, ...restLevels] = Object.values(LocationName);
  const finalSchema = newNodeSchema.extend({
    ...(node.getNextLevel() === (node.lastLevel || DEFAULT_LAST_POSITION)
      ? {
          capacity: z.number().min(0).multipleOf(1),
        }
      : {}),
    ...(node.getNextLevel() === LocationName.WAREHOUSE
      ? {
          lastLevel: z.enum([level1, ...restLevels]).optional(),
        }
      : {}),
  });

  const handleAddNode: SubmitHandler<z.infer<typeof finalSchema>> = (data) => {
    modifyLTree('Add', node, { ...data } as NodeData);
    setOpen(false);
    setUpdate(null);
  };
  const handleUpdateNode: SubmitHandler<z.infer<typeof finalSchema>> = (
    data
  ) => {
    if (!update) return;
    modifyLTree('Update', update, { ...data } as NodeData);
    setUpdate(null);
    setOpen(false);
  };

  return (
    <div className="flex flex-1 transition-all p-2 flex-col w-[500px] gap-2 border-x border-blue-400">
      <Modal
        title={
          !update
            ? `New ${node.getNextLevel()}`
            : `Update ${update.level} "${update.name}"`
        }
        open={open || !!update}
        onClose={() => {
          setUpdate(null);
          setOpen(false);
        }}
      >
        {update && (
          <div className="flex flex-col gap-1">
            <p className="border-y py-1 flex gap-2 text-sm">
              Capacity: {update.capacity}
            </p>
            <p className="border-y py-1 flex gap-2 text-sm">
              Qantity: {update.quantity}
            </p>
            {update.items.map((item) => (
              <p className="border-y py-1 flex gap-2 bg-gray-200 text-sm">
                {item.item}: {item.quantity}
              </p>
            ))}
            <button
              onClick={() => modifyLTree('Remove', update)}
              className="btn py-1 w-fit justify-self-end self-end my-1 bg-red-300 hover:bg-red-600 flex gap-2"
            >
              <MdDeleteForever /> Delete permanently
            </button>
          </div>
        )}
        <DynamicForm
          instance={
            !!update
              ? {
                  name: update.name,
                  capacity: update.capacity,
                  quantity: update.quantity,
                }
              : undefined
          }
          metadata={{
            lastLevel: { warningText: `Last level can't be changed later.` },
          }}
          onSubmit={!update ? handleAddNode : handleUpdateNode}
          schema={finalSchema}
        />
      </Modal>
      <div className="flex border-b items-center justify-between pb-2">
        <div className="block font-bold p-2 capitalize rounded">
          {node.getNextLevel() && node.getNextLevel() + 's'}
        </div>
        {node.level !== (node.lastLevel || DEFAULT_LAST_POSITION) && (
          <button
            onClick={() => setOpen(true)}
            className="icon-button-outline cursor-pointer p-2 text-lg group"
          >
            <MdAdd />
          </button>
        )}
      </div>

      {node.children.map((nd) => (
        <div
          onClick={() => handleMakeActive(nd)}
          key={nd.name}
          className={`${
            activePath[nd.level] === nd.lpath[nd.level]
              ? 'border-blue-500 '
              : 'text-white bg-gray-500  hover:bg-gray-600 hover:text-white border-b '
          } font-bold cursor-pointer btn p-2 flex items-center justify-between  mb-2 relative `}
        >
          <span
            style={{ width: `${(nd.quantity * 100) / nd.capacity}%` }}
            className={`
            ${
              activePath[nd.level] === nd.lpath[nd.level]
                ? 'bg-blue-500'
                : 'bg-gray-300/70'
            }
             absolute ${
               (nd.quantity * 100) / nd.capacity > 90 ? 'bg-red-400/80' : ''
             }  h-full left-0 rounded-md px-[2px] shadow-md pointer-events-none border-r border-r-blue-900 `}
          ></span>
          <span
            className="z-10 hover:text-red-500s inline-block pointer-events-none break-keep"
            style={{ textShadow: '4px 4px 4px rgba(0,0,0,.5)' }}
          >
            <span className="flex flex-col gap-1">
              <span>
                {nd.name} {` (${nd.quantity} - ${nd.capacity}) `}
              </span>
            </span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setUpdate(nd);
            }}
            className="justify-self-end z-10 inline-block bg-gray-200 p-1 self-end icon-button-outline cursor-pointer text-lg group"
          >
            <MdInfo />
          </button>
        </div>
      ))}
    </div>
  );
};

export default function LocationPage() {
  return (
    <LocationProvider>
      <LocationPreview />
    </LocationProvider>
  );
}

export function SaveLocations() {
  const [open, setOpen] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const { saveTree, changes, resetTree } = useLocationContext();

  return (
    <>
      <Modal
        title={`${isReset ? 'Reset' : 'Save'} Location Info`}
        open={open || isReset}
        onClose={() => {
          setOpen(false);
          setIsReset(false);
        }}
      >
        <p className="text-2xl my-3 text-red-400">
          {isReset
            ? 'This will clear all unsaved data.'
            : 'Some information may not be changed after saving.'}
        </p>

        <div className="border-b my-5"></div>

        {isReset ? (
          <button
            onClick={() => {
              resetTree();
              setOpen(false);
              setIsReset(false);
            }}
            className="btn flex gap-2 items-center bg-red-400 hover:bg-red-600 "
          >
            <MdRestartAlt /> Confirm Reset Changes
          </button>
        ) : (
          <button
            onClick={() => {
              saveTree();
              setOpen(false);
              setIsReset(false);
            }}
            className="btn bg-blue-500 flex gap-2 items-center my-1"
          >
            <MdVerified />
            Confirm Save Changes
          </button>
        )}
      </Modal>
      {changes > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-bold x-2">Changes: {changes}</span>
          <button
            onClick={() => setIsReset(true)}
            className="btn flex gap-2 items-center bg-red-500 hover:bg-red-600 "
          >
            <MdRestartAlt /> Reset Change
          </button>
          <button
            onClick={() => setOpen(true)}
            className="btn flex gap-2 items-center my-1"
          >
            <MdVerified />
            Save Changes
          </button>
        </div>
      )}
    </>
  );
}

const OpenLocationPath = () => {
  const { lTree, activePath, changePathKey } = useLocationContext();
  const [msg, setMsg] = useState('');

  const handleValidatePath: React.EventHandler<
    React.KeyboardEvent<HTMLInputElement>
  > = (e) => {
    if (e.key === 'Enter') {
      const node = lTree.findNodeByPath(
        e.currentTarget.value.toLowerCase().replaceAll(' ', '_')
      );
      if (node) {
        changePathKey(node);
        setMsg('');
      } else {
        setMsg('Path not found');
      }
    }
  };

  return (
    <div className={`flex flex-col gap-1 my-1`}>
      <input
        type="text"
        className={`${msg ? ' border-red-400' : ''} `}
        onKeyDown={handleValidatePath}
        placeholder="Enter path"
      />
      {msg && <p className="text-red-400 my-1 text-xs font-bold">{msg}</p>}
    </div>
  );
};
