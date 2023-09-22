
import {useState} from "react";
import {useFirestoreCollectionData} from "reactfire";
import Spinner from "../../components/Spinner";
import {MdAdd, MdDeleteForever, MdEdit} from "react-icons/md";
import Modal from "../../components/Modal";
import ItemsCreateForm from "../../components/forms/ItemsCreateForm";
import { Items as DbItems } from "../../database";

const Items = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const {status, error, data: items} = useFirestoreCollectionData(DbItems.ref);

  return (
    <div className="my-5">
      {status === "loading" && <Spinner />}
      {status === "error" && (
        <div className="text-red-400 p-2">Error occured: {error?.message}</div>
      )}

      <div className="flex mb-2 justify-end">
        <button onClick={() => setModalOpen((pre) => !pre)} className="btn ">
          <MdAdd /> Add Item
        </button>
      </div>

      <Modal
        title="Create Item"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        {<ItemsCreateForm />}
      </Modal>
      <table className="w-full text-sm text-left text-gray-500 ">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 ">
          <tr>
            <th scope="col" className="px-6 text-start py-3">
              Name
            </th>
            <th scope="col" className="px-6 text-center py-3">
              Code
            </th>
            <th scope="col" className="px-6 font-bold text-end py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items &&
            items.map((cp) => (
              <tr key={cp.name} className="bg-white border-b  ">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                >
                  {cp.name}
                </th>
                <td className="px-6 py-4 text-center">{cp.code}</td>
                <td className="px-6 text-xl py-4 flex gap-2 justify-end">
                  <span className="icon-button-outline cursor-pointer text-lg group">
                    <MdEdit className="text-blue-500  group-hover:[color:white!important]" />
                  </span>
                  <span className="icon-button-outline text-lg">
                    <MdDeleteForever className="text-red-500" />
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Items;
