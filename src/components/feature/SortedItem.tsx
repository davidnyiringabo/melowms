import React from "react";
import Table from "../Table";
import { useCustomAuth } from "../../context/Auth";
import { DocNode, SortedCheckedEmpties } from "../../database";
import { TotalCalc } from "../../context/TableContext";

export const SortedItem = ({ instance }: { instance: any }) => {
  const { Branch } = useCustomAuth();
  const SortedCheckedEmptiesQuery = (Branch as DocNode).sub(
    SortedCheckedEmpties
  );
  const calcTotal: TotalCalc<any> = (data: any[]) => {
    const total = data.reduce((acc, cur) => {
      return acc + cur.quantity;
    }, 0);
    return [
      {
        important: true,
        totalName: "Total",
        value: total,
      },
    ];
  };
  return (
    <>
      <Table
        collectionName="Sorted Items"
        collectionSingular="Sorted Items"
        columns={["itemName", "quantity", "dateChecked", "doneBy"]}
        defaultSearchField="itemName"
        searchField="itemName"
        cantUpdate
        cantDelete
        cantAct
        cantView
        maxCreate={0}
        totalCalc={calcTotal}
        hasTotals
        createForm={null}
        query={SortedCheckedEmptiesQuery.ref}
      />
    </>
  );
};
