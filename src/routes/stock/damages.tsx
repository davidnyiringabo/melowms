import { useCustomAuth } from "../../context/Auth";
import { DamagedProducts, DocNode } from "../../database";
import Table from "../../components/Table";
import DamagesForm from "../../components/forms/DamagesForm";
import { TotalCalc } from "../../context/TableContext";
import DamagedItems, { renderId } from "../../components/feature/DamagedItems";
const Damages = () => {
  const { Branch } = useCustomAuth();

  const damages = (Branch as DocNode).sub(DamagedProducts);

  const totalCalc: TotalCalc<any> = (data) => {
    return [
      {
        totalName: "TotalDamaged",
        value: data.reduce((a, c) => a + c.quantity, 0),
        important: true,
      },
      {
        totalName: "Total Approved",
        value: data.reduce((a, c) => a + (c.approved ? c.quantity : 0), 0),
        important: true,
      },
    ];
  };
  return (
    <Table
      collectionName="Damages"
      hasTotals
      // createForm={<DamagesForm />}
      createForm={null}
      cantUpdate
      onShow={(instance) => (
        <DamagedItems
          handleSave={() => {
            damages.doc(instance.id).update({ approved: true });
          }}
          instance={instance}
        />
      )}
      totalCalc={totalCalc}
      columns={["sortId", "quantity", "dateSorted", "approved"]}
      transform={{
        sortId: (data) => renderId(data.id),
      }}
      defaultSearchField="id"
      searchField="id"
      maxCreate={0}
      query={damages.ref}
      canRange
    />
  );
};

export default Damages;
