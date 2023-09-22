import React, { useState } from 'react';
import EmptiesGroupForm from '../../components/forms/sales/EmptiesGroupForm';
import Modal from '../../components/Modal';
import { MdAdd } from 'react-icons/md';
import Table from '../../components/Table';
import { useCustomAuth } from '../../context/Auth';
import { DocNode, FillableGroups } from '../../database';

const BranchSettings = () => {
  return (
    <div className="flex border-b pb-2 flex-col">
      <FillableSettings />
    </div>
  );
};

export function FillableSettings() {
  // const [open, setOpen] = useState(false);
  const { Branch } = useCustomAuth();
  const grpQuery = (Branch as DocNode).sub(FillableGroups).ref;
  return (
    <div>
      <div className="flex items-center gap-2 w-full justify-between">
        <h3 className="text-lg font-semibold pb-2 border-b w-full ">
          Fillable Groups
        </h3>
      </div>

      <Table
        query={grpQuery}
        cantView={true}
        collectionName="fillable groups"
        columns={['groupName', 'maxAllowed', 'provided', 'returned']}
        columsAs={{ maxAllowed: 'Default Max Allowed' }}
        defaultSearchField="groupName"
        createForm={<EmptiesGroupForm />}
        getUpdateForm={(instance) => <EmptiesGroupForm instance={instance} />}
      />
    </div>
  );
}

export default BranchSettings;
