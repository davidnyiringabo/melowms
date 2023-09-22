import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useTableContext } from '../context/TableContext';
import { MdArrowDownward, MdDateRange } from 'react-icons/md';
import Modal from './Modal';
import CustomRangeForm from './forms/CustomRangeForm';

export enum DefaultRangeName {
  Today = 'Today',
  Yesterday = 'Yesterday',
  Week = 'This Week',
  Month = 'This Month',
  Custom = 'Custom Range',
}
export type DefaultRange = {
  name: DefaultRangeName;
  startDate: Date;
  endDate: Date;
};

const defaultRanges: DefaultRange[] = [
  {
    name: DefaultRangeName.Today,
    startDate: moment().startOf('day').toDate(),
    endDate: moment().endOf('day').toDate(),
  },
  {
    name: DefaultRangeName.Yesterday,
    startDate: moment().subtract(1, 'day').startOf('day').toDate(),
    endDate: moment().subtract(1, 'day').endOf('day').toDate(),
  },
  {
    name: DefaultRangeName.Week,
    startDate: moment().startOf('isoWeek').toDate(),
    endDate: moment().endOf('isoWeek').toDate(),
  },
  {
    name: DefaultRangeName.Month,
    startDate: moment().startOf('month').toDate(),
    endDate: moment().endOf('month').toDate(),
  },
];

const TableRange = () => {
  const { startDate, endDate, hasCustomRange, handleUpdateRange } =
    useTableContext();
  const [ranges] = useState(defaultRanges);
  const [selectedRange, setSelectedRange] = useState<DefaultRange>(
    defaultRanges[0]
  );
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState(false);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (custom || !selectedRange) return;
    handleUpdateRange(selectedRange.startDate, selectedRange.endDate);
  }, [selectedRange, custom]);

  useEffect(() => {
    if (!custom && hasCustomRange) {
      setCustom(true);
    }
  }, [hasCustomRange]);

  useEffect(() => {
    const listen = (ev: MouseEvent) => {
      const target = ev.target as HTMLDivElement;
      if (target.closest('[data-select-range]')) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('click', listen);
    return () => {
      window.removeEventListener('click', listen);
    };
  });

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="relative   border-blue-400 rounded bg-blue-200 flex items-center justify-between  w-fit min-w-[130px]">
        <button
          data-select-range
          className="btn hover:ring-0 flex items-center m-0 border border-blue-900 h-full rounded  p-2 gap-2 justify-between w-full hover:cursor-pointer"
          onClick={() => setOpen((p) => !p)}
        >
          {custom ? (
            <span className="font-bold break-keep">
              <span className="break-keep">
                {startDate.toLocaleDateString('en-rw', {
                  month: 'short',
                  day: '2-digit',
                  // dateStyle: 'medium',
                })}
              </span>
              {' - '}
              <span className="break-keep">
                {endDate.toLocaleDateString('en-rw', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            </span>
          ) : (
            selectedRange.name
          )}
          <MdArrowDownward />
        </button>
        {open && (
          <div className="flex top-full right-0 flex-col gap-2 p-2 z-10 bg-white border    absolute rounded-md shadow-md">
            {ranges.map((r) => (
              <div
                className={`${
                  selectedRange?.name === r.name && !custom
                    ? 'bg-blue-200 border-blue-400'
                    : ''
                } border-transparent capitalize cursor-pointer p-1 px-2 rounded hover:bg-blue-200 hover:border-blue-400`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedRange(r);
                  setCustom(false);
                  setOpen(false);
                }}
                key={r.name}
              >
                {r.name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <button
          onClick={() => setCustomOpen(true)}
          className="btn hover:ring-0 p-2 pl-3 bg-white border border-blue-500 text-blue-500 hover:text-white hover:bg-blue-500"
        >
          Custom Range
          <MdDateRange />
        </button>
      </div>
      {
        <Modal
          title="Custom Range"
          open={customOpen}
          onClose={() => setCustomOpen(false)}
        >
          <CustomRangeForm onCustom={() => setCustom(true)} />
        </Modal>
      }
    </div>
  );
};

export default TableRange;
