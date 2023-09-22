import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  TruckIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import { useDashboard } from '../../context/DashboardContext';
import { statisticsCard } from '../../data/statistics-cards-data';
import Modal from '../Modal';
import { useEffect, useState } from 'react';
import toRwf from '../../helpers/toRwf';
import { StatsLevel } from '../../helpers/statsTree';
import { EntryType } from '../../helpers/statsTree';
import { MdArrowDropDown, MdArrowDropUp, MdPayments } from 'react-icons/md';
import BranchReports from './BranchReports';

export default function Report() {
  const { sNode, statType, changeStatType, viewType, isCompany, sTree } =
    useDashboard();
  const [open, setOpen] = useState(false);
  const [maxGrid, setMaxGrid] = useState(3);

  useEffect(() => {
    if (sNode.stats.transfered !== 0 && sNode.stats.accepted !== 0)
      setMaxGrid(4);
    else if (sNode.stats.accepted !== 0 || sNode.stats.transfered !== 0)
      setMaxGrid(3);
    else setMaxGrid(3);
  }, [sNode]);

  const statisticsCardsData: statisticsCard[] = [
    {
      title: 'Current Stock',
      name: 'stock',
      value: toRwf(sTree.rootStats.stock),
      footer: {
        value: `${sNode.stats.stock}`,
        label: `${sTree.getDataUntil(sNode, 'stock') - sNode.stats.stock}`,
      },
      icon: ShoppingCartIcon,
    },
    {
      title: 'Total Sales',
      name: 'sales',
      value: toRwf(sTree.rootStats.sales),
      footer: {
        value: sNode.stats.sales.toString(),
        label: `${sTree.getDataUntil(sNode, 'sales') - sNode.stats.sales}`,
      },
      moreInfo: { key: `Sales VAT`, value: toRwf(sNode.stats.sVAT) },
      icon: CurrencyDollarIcon,
    },
    {
      name: 'purchase',
      title: 'Total Purchases',
      value: toRwf(sTree.rootStats.purchase),
      footer: {
        value: `${sNode.stats.purchase}`,
        label: `${
          sTree.getDataUntil(sNode, 'purchase') - sNode.stats.purchase
        }`,
      },
      moreInfo: { key: `Purchase VAT`, value: toRwf(sNode.stats.pVAT) },
      icon: WalletIcon,
    },
    {
      name: 'expenses',
      title: 'Total Expenses',
      value: toRwf(sTree.rootStats.expenses),
      footer: {
        value: `${sNode.stats.expenses}`,
        label: `${
          sTree.getDataUntil(sNode, 'expenses') - sNode.stats.expenses
        }`,
      },
      icon: MdPayments,
    },
    ...(sNode.stats.transfered !== 0
      ? ([
          {
            name: 'transfered',
            title: 'OUT-Transfers',
            value: toRwf(sTree.rootStats.transfered),
            footer: {
              value: `${sNode.stats.transfered}`,
              label: `${
                sTree.getDataUntil(sNode, 'transfered') - sNode.stats.transfered
              }`,
            },
            icon: TruckIcon,
          },
        ] as statisticsCard[])
      : []),
    ...(sNode.stats.accepted !== 0
      ? ([
          {
            name: 'accepted',
            title: 'IN-Transfers',
            value: toRwf(sTree.rootStats.accepted),
            footer: {
              value: `${sNode.stats.accepted}`,
              label: `${
                sTree.getDataUntil(sNode, 'accepted') - sNode.stats.accepted
              }`,
            },
            icon: TruckIcon,
          },
        ] as statisticsCard[])
      : []),
  ];

  const supportedPopups: EntryType[] = [
    'stock',
    'sales',
    'purchase',
    'expenses',
    'accepted',
    'transfered',
  ];

  return (
    <div
      className={`grid gap-y-10 gap-x-6 md:grid-cols-2 ${
        maxGrid === 3
          ? ' lg:grid-cols-3 xl:grid-cols-3'
          : maxGrid === 4
          ? 'lg:grid-cols-4 xl:grid-cols-4'
          : 'lg:grid-cols-4 xl:grid-cols-5'
      }`}
    >
      <Modal
        title={`Branch "${statType}" reports`}
        open={isCompany && open}
        onClose={() => setOpen(false)}
      >
        <BranchReports />
      </Modal>
      {statisticsCardsData.map((value, index) => (
        <div
          key={index}
          tabIndex={0}
          onClick={() => {
            if (!supportedPopups.includes(value.name)) return;
            changeStatType(value.name);
            setOpen(true);
          }}
          className="bg-blue-100/50 hover:bg-blue-100 flex flex-col cursor-pointer rounded-xl px-4 pb-4 relative"
        >
          <div className="flex flex-row-reverse justify-between">
            <div className="bg-blue-600 p-2 rounded-3xl -mt-3 -mr-5 h-8 w-8">
              {<value.icon className="text-white" />}
            </div>
            <div className="pt-4">
              <p className=" font-semibold text-blue-500 mb-1">{value.title}</p>
              <p className="text-md font-mono text-lg font-bold">
                {value.value}
              </p>
            </div>
          </div>
          <div className="border-t w-1/3 translate-y-3 border-blue-500/60 mt-0 mb-1 " />
          <div className="pt-3 mt-2">
            <p className="text-sm font-semibold text-blue-500/60 mb-2">
              Total{' '}
              <span className="font-extrabold text-blue-700/60 underline-offset-2">
                before
              </span>{' '}
              selected <span className="lowercase">{viewType}</span>
            </p>
            <span className="font-mono text-xl font-bold">
              {toRwf(Number(value.footer.label))}
            </span>
          </div>
          <div className="pt-2 flex-1">
            <p className="text-sm font-semibold text-blue-500 mb-2">
              <span className="font-extrabold text-blue-700/60 underline-offset-2">
                Change
              </span>{' '}
              {viewType === StatsLevel.Day ? 'On' : 'In'} selected{' '}
              <span className="lowercase">{viewType}</span>
            </p>
            <p className=" text-xl grid grid-cols-2">
              <span
                className={`${
                  Number(value.footer.value) > 0
                    ? `text-green-600`
                    : Number(value.footer.value) < 0
                    ? `text-red-600`
                    : ''
                } font-mono flex items-center font-bold`}
              >
                <span className="flex items-center">
                  {Number(value.footer.value) > 0 ? (
                    <>
                      <MdArrowDropUp /> <span>+</span>
                    </>
                  ) : Number(value.footer.value) !== 0 ? (
                    <MdArrowDropDown />
                  ) : (
                    ''
                  )}
                </span>
                {toRwf(Number(value.footer.value) || 0)}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
