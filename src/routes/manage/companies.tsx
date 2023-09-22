import { useEffect, useState } from 'react';
import { useFirestoreCollectionData } from 'reactfire';
import Spinner from '../../components/Spinner';
import { MdAdd, MdDeleteForever, MdEdit } from 'react-icons/md';
import Modal from '../../components/Modal';
import CreateCompanyForm from '../../components/forms/CreateCompanyFrom';
import { useCustomAuth } from '../../context/Auth';
import { Branch } from '../../types';
import CreateBranchForm from '../../components/forms/CreateBranchForm';
import { Branches, Companies } from '../../database';
import withAuthorization from '../../components/hocs/withAuthorization';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/Table';

export type Company = {
  name: string;
  tinnumber: number;
};

const CompaniesPage = () => {
  const { isAdmin, isSuperAdmin, isManager, tinnumber } = useCustomAuth();
  const companyQuery = isSuperAdmin
    ? Companies.ref
    : Companies.doc(tinnumber as string).sub(Branches).ref;
  const navigate = useNavigate();

  useEffect(() => {
    if (isManager) {
      navigate('/manage/users');
    }
  }, [isManager]);

  const { status, error, data } = useFirestoreCollectionData(companyQuery);

  return (
    <div className="my-5">
      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <div className="text-red-400 p-2">Error occured: {error?.message}</div>
      )}
      {isAdmin && data && <BranchInfo />}
      {isSuperAdmin && data && <CompaniesInfo companies={data as Company[]} />}
    </div>
  );
};

export default CompaniesPage;

export const CompaniesInfo = withAuthorization({
  requiredClaims: { admin: true },
})(({ companies }: { companies: Company[] }) => {
  return (
    <Table
      query={Companies.ref}
      collectionName={Companies.name}
      columns={['name', 'tinnumber', 'address', 'email']}
      collectionSingular={'Company'}
      createForm={<CreateCompanyForm />}
    />
  );
});

export function BranchInfo() {
  const { tinnumber } = useCustomAuth();
  const branchQuery = Companies.doc(tinnumber as string).sub(Branches).ref;

  return (
    <Table
      query={branchQuery}
      collectionName={Branches.name}
      cantView={true}
      defaultSearchField='name'
      collectionSingular={'Branch'}
      columns={['name', 'address', 'createdTime']}
      createForm={<CreateBranchForm />}
      getUpdateForm={(instance) => <CreateBranchForm instance={instance} />}
    />
  );
}
