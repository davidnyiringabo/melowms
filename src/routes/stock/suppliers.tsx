import SupplierForm from '../../components/forms/SupplierForm';
import withAuthorization from '../../components/hocs/withAuthorization';
import Table from '../../components/Table';
import { useCustomAuth } from '../../context/Auth';
import { DocNode, Suppliers } from '../../database';
import { collectionGroup, query, where } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { Supplier } from '../../types';

const Page = () => {
  const { Branch, isAdmin, isSuperAdmin, tinnumber } = useCustomAuth();
  const firestore = useFirestore();

  const suppliersQuery = isSuperAdmin
    ? collectionGroup(firestore, Suppliers.name)
    : isAdmin
    ? query(
        collectionGroup(firestore, Suppliers.name),
        where('path.companies', '==', tinnumber)
      )
    : (Branch as DocNode).sub(Suppliers).ref;

  return (
    <Table
      collectionName="suppliers"
      cantView={true}
      query={suppliersQuery}
      createForm={<SupplierForm />}
      getUpdateForm={(sup) => <SupplierForm supplier={sup as Supplier} />}
      columns={['name', 'phone', 'email', 'address']}
    />
  );
};

export default withAuthorization({
  requiredClaims: { admin: true, manager: true },
  all: false,
})(Page);
