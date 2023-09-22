import RoleForm from '../../components/forms/RoleForm';
import withAuthorization from '../../components/hocs/withAuthorization';
import Table from '../../components/Table';
import { Role } from '../../types';
import { DefaultRoles } from '../../database';

const Page = () => {
  const rolesQuery = DefaultRoles.ref;

  return (
    <div className="flex w-full flex-col">
      <Table
        collectionName="roles"
        query={rolesQuery}
        onShow={(role) => <ViewRole role={role} />}
        createForm={<RoleForm />}
        getUpdateForm={(instance) => <RoleForm instance={instance} />}
        columns={['name']}
      />
    </div>
  );
};

export default withAuthorization({
  requiredClaims: { admin: true, manager: true },
  all: false,
})(Page);

export function ViewRole({ role }: { role: Role }) {
  return (
    <div>
      <h4 className="my-2 text-sm px-1">{role?.name}</h4>
      <p className="my-2 text-sm px-1">{role?.description}</p>

      <h4 className="text-lg-text-gray-700 mb-3 underline">Permissions</h4>
      <ul>
        {role?.permissions.map((perm) => (
          <li className="text-sm list-item list-disc ml-2" key={perm}>
            {perm}
          </li>
        ))}
      </ul>
    </div>
  );
}
