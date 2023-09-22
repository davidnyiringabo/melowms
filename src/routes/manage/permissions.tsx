import CreatePermissionForm from '../../components/forms/CreatePermissionForm';
import withAuthorization from '../../components/hocs/withAuthorization';
import Table from '../../components/Table';
import { collection } from 'firebase/firestore';
import {
  useCallableFunctionResponse,
  useFirestore,
  useFirestoreDocData,
  useFunctions,
} from 'reactfire';
import { CollectionName, Permissions } from '../../database';
import cloudFunctionNames from '../../functionNames';
import Spinner from '../../components/Spinner';
import { httpsCallable } from 'firebase/functions';
import { MdRefresh } from 'react-icons/md';
const permissionTypes = [
  'read',
  'write',
  'get',
  'list',
  'delete',
  'update',
  'give',
  'all',
];

const PermissionPage = () => {
  const handleGeneratePermissions = async () => {
    const permissions: Array<string> = [];
    Object.values(CollectionName).map((collection) => {
      const collectionName = collection;

      permissionTypes.forEach((perm) => {
        permissions.push(
          `${collectionName}_${perm}`,
          `${collectionName}_give_${perm}`
        );
      });
    });

    await Permissions.doc('perms0').save({ permissions });
  };

  const { data, status } = useFirestoreDocData(Permissions.doc('perms0').ref, {
    idField: 'id',
  });

  return (
    <div className=" p-2">
      <div className="flex justify-between items-center">
        <h4 className="font-bold">All Permissions</h4>
        <button onClick={handleGeneratePermissions} className="btn my-2 ">
          <MdRefresh /> Refresh Permissions
        </button>
      </div>

      {status === 'loading' && <Spinner />}
      {data &&
        (data.permissions as string[]).map((perm) => (
          <div key={perm} className="p-2 border-y">
            {perm}
          </div>
        ))}
    </div>
  );
};

export default withAuthorization({
  requiredClaims: { admin: true, manager: true },
  all: false,
})(PermissionPage);
