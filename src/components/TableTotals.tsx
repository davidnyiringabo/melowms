import React from 'react';
import { useTableContext } from '../context/TableContext';
import toRwf from '../helpers/toRwf';

const TableTotals = () => {
  const { filteredData, totalCalc } = useTableContext();

  if (!totalCalc) return <></>;

  return (
    <div className="flex text-xs p-1 my-2 border w-full bg-white rounded border-b flex-wrap md:flex-nowrap items-center">
      <div
        className={`flex flex-wrap gap-2 p-1 [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border items-center`}
      >
        {totalCalc(filteredData).map((calc) => (
          <>
            <span
              className={`${
                calc.important
                  ? 'mr-2 font-bold text-blue-500'
                  : 'mr-2 font-bold'
              } `}
            >
              {calc.totalName}
            </span>
            <span
              className={`
            ${
              calc.important
                ? '[background-color:rgb(59_130_246_/_var(--tw-bg-opacity))_!important] text-white text-sm'
                : 'text-sm'
            } font-bold`}
            >
              {toRwf(calc.value)}
            </span>
          </>
        ))}
      </div>
    </div>
  );
};

export default TableTotals;
