import { useState, useEffect } from 'react';
import {
  MdAdd,
  MdArrowCircleLeft,
  MdArrowCircleRight,
  MdDateRange,
  MdMinimize,
} from 'react-icons/md';
import { useDashboard } from '../../context/DashboardContext';
import StatsTree, { StatsLevel } from '../../helpers/statsTree';
import Modal from '../Modal';
import StatsDateForm from '../forms/StatsDateForm';
import moment from 'moment';

export default function StatsConfig() {
  const [open, setOpen] = useState(false);
  const [activeI, setActiveI] = useState<number>(-1);
  const { viewType, viewDate, changeViewType, changeViewDate } = useDashboard();
  const [mNode, setMNode] = useState(
    // Math.round((viewDate.getDate() + (viewDate.getDay() + 1)) / 7).toString()
    StatsTree.getNextLevelKeyByDate(StatsLevel.Month, viewDate) as string
  );

  useEffect(() => {
    switch (activeI) {
      case 10:
        changeViewType(StatsLevel.Day);
      case 0:
        changeViewType(StatsLevel.Week);
        break;
      case 1:
        changeViewType(StatsLevel.Month);
        break;
      case 2:
        changeViewType(StatsLevel.Year);
        break;
    }
    // if (activeI !== -1) changeViewDate(new Date());
  }, [activeI]);

  useEffect(() => {
    setMNode(
      //   Math.round(
      //     (viewDate.getDate() + (viewDate.getDay() + 1)) / 7
      //   ).toString() as string
      StatsTree.getNextLevelKeyByDate(StatsLevel.Month, viewDate) as string
    );
  }, [viewDate]);

  const DecrementSpan = ({ vType }: { vType: StatsLevel }) => (
    <span
      onClick={() => changeViewDate(addPeriodToDate(viewDate, vType, -1))}
      role="button"
      tabIndex={0}
      className="icon-button-outline p-1"
    >
      <MdMinimize className="-translate-y-1" />
    </span>
  );

  const IncrementSpan = ({ vType }: { vType: StatsLevel }) => (
    <span
      onClick={() => changeViewDate(addPeriodToDate(viewDate, vType))}
      role="button"
      tabIndex={0}
      className="icon-button-outline p-1"
    >
      <MdAdd />
    </span>
  );

  return (
    <div
      style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px' }}
      className="flex m-2 p-2  rounded-md"
    >
      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Choose custom date"
        >
          <StatsDateForm />
        </Modal>
      )}
      <button
        onClick={() => {
          setActiveI(-1);
          changeViewType(StatsLevel.Day);
        }}
        className={`btn ${
          viewType !== StatsLevel.Day
            ? ' text-blue-500 bg-white border border-blue-500 '
            : ' cfg-btn '
        }`}
      >
        {<DecrementSpan vType={StatsLevel.Day} />}
        <span className="flex-1 flex items-center gap-1 justify-center w-16">
          {viewDate.toLocaleString('default', { weekday: 'short' })}{' '}
          {viewDate.toLocaleString('default', { day: '2-digit' })}
        </span>
        {<IncrementSpan vType={StatsLevel.Day} />}
      </button>
      {/* <button
        onClick={() => setActiveI(0)}
        className={`btn  ${
          viewType !== StatsLevel.Week
            ? ' text-blue-500 bg-white border border-blue-500 [.icon-button-outline]:bg-white  '
            : ' cfg-btn '
        }`}
      >
        {<DecrementSpan vType={StatsLevel.} />}
        <span className="flex-1 w-16">Week {mNode}</span>
        {<IncrementSpan vType={StatsLevel.} />}
      </button> */}
      <button
        onClick={() => setActiveI(1)}
        className={`btn ${
          viewType !== StatsLevel.Month
            ? ' text-blue-500 bg-white border border-blue-500 '
            : ' cfg-btn '
        }`}
      >
        {<DecrementSpan vType={StatsLevel.Month} />}
        <span className="flex-1 w-12">
          {viewDate.toLocaleString('default', { month: 'short' })}
        </span>
        {<IncrementSpan vType={StatsLevel.Month} />}
      </button>
      <button
        onClick={() => setActiveI(2)}
        className={`btn ${
          viewType !== StatsLevel.Year
            ? ' text-blue-500 bg-white border border-blue-500 '
            : ' cfg-btn '
        }`}
      >
        {<DecrementSpan vType={StatsLevel.Year} />}
        <span className="flex-1 w-12">{viewDate.getFullYear()}</span>
        {<IncrementSpan vType={StatsLevel.Year} />}
      </button>
      <button
        onClick={() => {
          setActiveI(3);
          setOpen(true);
        }}
        className={`btn ${
          viewDate.toLocaleDateString() === new Date().toLocaleDateString()
            ? ' text-blue-500 bg-white border border-blue-500 '
            : ' cfg-btn '
        }`}
      >
        Custom <MdDateRange />
      </button>
    </div>
  );
}

function addPeriodToDate(
  currentDate: Date,
  period: StatsLevel,
  dir: -1 | 1 = 1
): Date {
  const newMoment = moment(currentDate);

  switch (period) {
    case 'Day':
      newMoment.add(dir, 'day');
      break;
    case 'Week':
      newMoment.add(dir, 'week');
      break;
    case 'Month':
      newMoment.add(dir, 'month');
      break;
    case 'Year':
      newMoment.add(dir, 'year');
      break;
    default:
      throw new Error(`Invalid period: ${period}`);
  }

  return newMoment.toDate();
}
