import { useCustomAuth } from "../../context/Auth";
import {
  BranchFillables,
  Branches,
  Companies,
  Customers,
  DocNode,
  EmptiesReturns,
  ItemsTaken,
} from "../../database";
import { Query, query, where } from "firebase/firestore";
import Table from "../Table";
import CustomerForm from "../forms/sales/CustomerForm";
import Customer from "./Customer";
import { useSalesContext } from "../../context/SalesContext";
import { useModalContext } from "../../context/ModalContext";
import {
  Branch,
  Customer as CustomerType,
  Fillable,
  PropsWithInstace,
} from "../../types";
import withAuthorization from "../hocs/withAuthorization";
import CreateBranchForm from "../forms/CreateBranchForm";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import { useFirestoreDocData } from "reactfire";
import Modal from "../Modal";
import BranchFillablesForm from "../forms/sales/BranchFillablesForm";
import { MdEdit, MdRecycling } from "react-icons/md";
import CustomerReturnsForm from "../forms/sales/CustomerReturnsForm";

const OrderCustomers = () => {
  const { Branch } = useCustomAuth();
  const { changeCustomer, customer } = useSalesContext();
  const { handleClose } = useModalContext();

  const customersQuery = Branch?.sub(Customers).ref;

  return (
    // <div className="flex border rounded flex-col w-full h-full">
    //   <h3 className="flex items-center text-blue-900 bg-blue-200/70 font-bold border-b p-1 gap-3">
    //     <MdPersonAdd className="w-6 h-6 ml-2" /> Choose Customer
    //   </h3>
    <Table
      query={customersQuery as Query}
      canSelect={true}
      onSelectInstance={(instances) => {
        changeCustomer(instances[0] as CustomerType | undefined);
        if (instances[0]) {
          // handleClose();
        }
      }}
      
      defaultSelected={customer?.id}
      defaultSearchField="name"
      onShow={(instance) => <Customer instance={instance} />}
      collectionName={Customers.name}
      columns={["name", "tinnumber", "phone"]}
      createForm={<CustomerForm />}
      getUpdateForm={(instance) => <CustomerForm instance={instance} />}
    />
    // </div>
  );
};

export default withAuthorization({ requiredClaims: { manager: true } })(
  OrderCustomers
);

export const OrderBranches = () => {
  const { tinnumber, branchData } = useCustomAuth();
  const { changeBranch } = useSalesContext();
  const { handleClose } = useModalContext();

  const branchesQuery = branchData?.name
    ? query(
        Companies.doc(tinnumber as string).sub(Branches).ref,
        where("name", "!=", branchData?.name)
      )
    : Companies.doc(tinnumber as string).sub(Branches).ref;
  return !branchData?.name ? (
    <Spinner />
  ) : (
    <Table
      query={branchesQuery}
      onSelectInstance={(instances) => {
        changeBranch(instances[0] as Branch | undefined);
        // handleClose();
      }}
      onShow={(instance) => (
        <BranchFillableComponent instance={instance as Branch} />
      )}
      collectionName={Branches.name}
      collectionSingular="branch"
      columns={["name", "address"]}
      canSelect={true}
      orderBy={{ direction: "asc", field: "name" }}
      createForm={<CreateBranchForm />}
      getUpdateForm={(instance) => <CreateBranchForm instance={instance} />}
    />
  );
};

export const BranchFillableComponent = ({
  instance: branch,
}: {
  instance: Branch;
}) => {
  const { Branch } = useCustomAuth();
  const { changeTitle } = useModalContext();
  const [open, setOpen] = useState(false);

  const fillablesQuery = (Branch as DocNode)
    .sub(BranchFillables)
    .doc(branch.id)
    .sub(ItemsTaken).ref;

  useEffect(() => {
    changeTitle(`Fillables for branch "${branch.name}"`);
  }, []);

  const returns = (Branch as DocNode)
    .sub(BranchFillables)
    .doc(branch.id)
    .sub(EmptiesReturns);

  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="flex m-0 bg-blue-50 rounded p-1 justify-end w-full">
        <button onClick={() => setOpen(true)} className="btn my-0 w-fit">
          <MdRecycling /> View return history
        </button>
      </div>
      <Modal
        title="Emballage return history"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Table
          createForm={<></>}
          maxCreate={0}
          canRange={true}
          cantAct={true}
          columns={["itemName", "returnedQuantity", "dateReturned"]}
          collectionName="Emballage Returns"
          query={returns.ref}
        />
      </Modal>
      <Table
        query={fillablesQuery}
        cantUpdate={true}
        maxCreate={0}
        defaultSearchField="itemName"
        columns={["itemName", "totalTaken", "totalReturned", "remaining"]}
        collectionName={"Fillables"}
        createForm={<></>}
        onShow={(instance) => (
          <CustomerReturnsForm
            customerOrBranch={branch}
            isBranch={true}
            instance={instance}
          />
        )}
      />
    </div>
  );
};
