import React from 'react';
import { useTableContext } from '../context/TableContext';
import { toNormalCase } from './Table';
import { DocumentData } from 'firebase/firestore';

const TableHeader = () => {
  const {
    canSelectMultiple,
    selectedIds,
    columsAs,
    handleSelectRecords,
    filteredData: data,
    ...props
  } = useTableContext();
  return (
    <tr>
      {props.canSelect && data && (
        <th scope="col" className={`border-x  text-xs  text-center px-3 py-3`}>
          {!canSelectMultiple ? (
            <span className="text-gray-500 font-bold text-xs">Select</span>
          ) : (
            <input
              checked={selectedIds.length === data.length}
              onChange={handleSelectRecords}
              type="checkbox"
            />
          )}
        </th>
      )}
      {data && data.length ? (
        (props.columns ? props.columns : Object.keys(data[0])).map(
          (k, i, arr) => (
            <th
              scope="col"
              className={`border-x text-xs text-center px-3 py-3`}
              key={k}
            >
              {columsAs && Object.keys(columsAs).includes(k as string)
                ? toNormalCase(columsAs[k].toString().split('.').join(' '))
                : toNormalCase(k.toString().split('.').join(' '))}
            </th>
          )
        )
      ) : (
        <></>
      )}
      {!props.cantAct && (
        <th className=" text-xs  text-center">
          {data && data.length
            ? 'Actions'
            : 'No ' + props.collectionName + ' found'}
        </th>
      )}
    </tr>
  );
};

export default TableHeader;
