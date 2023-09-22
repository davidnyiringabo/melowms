import React, { useState } from 'react';
import { useFirestore } from 'reactfire';
import { collectionGroup, query, where } from 'firebase/firestore';
import { useCustomAuth } from '../../context/Auth';
import CreateUserForm from '../../components/forms/CreateUserForm';
import CreateAdminForm from '../../components/forms/CreateAdminForm';
import Table from '../../components/Table';
import Spinner from '../../components/Spinner';
import withAuthorization from '../../components/hocs/withAuthorization';
import { Admins, Branches, Companies, DocNode, Users } from '../../database';

const ListUsers = () => {
  const [open, setOpen] = useState(false);
  const { isAdmin, isSuperAdmin, Branch, branchData, branch, tinnumber } =
    useCustomAuth();
  const firestore = useFirestore();

  const usersQuery = isSuperAdmin
    ? collectionGroup(firestore, Admins.name)
    : isAdmin
    ? query(
        collectionGroup(firestore, Users.name),
        where('tinnumber', '==', tinnumber)
      )
    : (Branch as DocNode).sub(Users).ref;

  return branch && !branchData ? (
    <Spinner />
  ) : (
    <Table
      collectionName={isSuperAdmin ? 'admins' : 'users'}
      cantView={true}
      defaultSearchField="displayName"
      createForm={isSuperAdmin ? <CreateAdminForm /> : <CreateUserForm />}
      getUpdateForm={(instance) =>
        isSuperAdmin ? (
          <CreateAdminForm instance={instance} />
        ) : (
          <CreateUserForm instance={instance} />
        )
      }
      {...(!isSuperAdmin
        ? {
            columnCollection: {
              getCollection(user) {
                return Companies.doc(user.tinnumber).sub(Branches);
              },
              display: 'name',
              column: 'branch',
            },
          }
        : {})}
      columns={[
        'displayName',
        'email',
        'manager',
        'phoneNumber',
        'disabled',
        'branch',
      ]}
      columsAs={{ displayName: 'Full Name' }}
      query={usersQuery}
    />
  );
};

export default withAuthorization({
  requiredClaims: { manager: true, admin: true },
  all: false,
})(ListUsers);
