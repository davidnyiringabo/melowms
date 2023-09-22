import { useDashboard } from '../../context/DashboardContext';
import { makeChart, statisticsChart } from '../../data/statistics-charts-data';

import Chart from 'react-apexcharts';
import { StatNode, StatsLevel } from '../../helpers/statsTree';
import { useEffect, useState } from 'react';
import numeral from 'numeral';
import { MdAlarm, MdSyncLock } from 'react-icons/md';

export default function ChartCards() {
  const { sNode: initialSNode, viewType, sTree, viewDate } = useDashboard();

  const [sNode, setSNode] = useState(initialSNode);
  const [maxGrid, setMaxGrid] = useState(3);

  useEffect(() => {
    if (sNode.stats.transfered !== 0 && sNode.stats.accepted !== 0)
      setMaxGrid(4);
    else if (sNode.stats.accepted !== 0 || sNode.stats.transfered !== 0)
      setMaxGrid(3);
    else setMaxGrid(3);
  }, [sNode]);

  useEffect(() => {
    if (viewType === StatsLevel.Day) {
      const node = sTree.findStatsByDate(
        viewDate,
        StatsLevel.Week,
        true
      ) as StatNode;
      setSNode(node);
    } else {
      setSNode(initialSNode);
    }
  }, [initialSNode]);

  const categories = sNode.getCategories();
  const stats: statisticsChart[] = [
    makeChart({
      categories,
      data: sNode.getData('stock'),
      color: 'blue',
      title: `${viewType} stock chart`,
      description: `Stock chart for selected ${viewType}`,
      footer: '',
      name: 'Stock',
      type: 'line',
    }),
    makeChart({
      categories,
      data: sNode.getData('sales'),
      color: 'blue',
      title: `${viewType} sales chart`,
      description: `Sales chart for selected ${viewType}`,
      name: 'Sales',
    }),
    makeChart({
      categories,
      data: sNode.getData('purchase'),
      color: 'blue',
      title: `${viewType} purchases chart`,
      description: `Purchases chart for selected ${viewType}`,
      name: 'Purchases',
    }),
    makeChart({
      categories,
      data: sNode.getData('expenses'),
      color: 'blue',
      title: `${viewType} expenses chart`,
      description: `Expenses chart for selected ${viewType}`,
      name: 'Expenses',
    }),
    ...(sNode.stats.transfered !== 0
      ? [
          makeChart({
            categories,
            data: sNode.getData('transfered'),
            color: 'blue',
            title: `${viewType} OUT-Transfers chart`,
            description: `OUT-Transfers chart for selected ${viewType}`,
            footer: '',
            name: 'OUT-Transfers',
          }),
        ]
      : []),
    ...(sNode.stats.accepted !== 0
      ? [
          makeChart({
            categories,
            data: sNode.getData('accepted'),
            color: 'blue',
            title: `${viewType} IN-Transfers chart`,
            description: `IN-Transfers chart for selected ${viewType}`,
            footer: '',
            name: 'IN-Transfers',
          }),
        ]
      : []),
  ];
  return (
    <div className="mt-10">
      <div
        className={`mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 ${
          maxGrid === 4
            ? 'lg:grid-cols-4 xl:grid-cols-4'
            : 'lg:grid-cols-3 xl:grid-cols-3'
        }`}
      >
        {stats.map((value, index) => (
          <div key={index} className="bg-blue-100/50 rounded-xl">
            <div className="p-2">
              <Chart
                className="relative bg-clip-border mx-0 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-blue-500/40 shadow-lg"
                {...value.chart}
              />
            </div>
            <div className="p-2 px-4 flex gap-3 items-center pb-2">
              <MdAlarm className="text-3xl" />
              <div className="p-1 flex-col flex gap-1">
                <p className="text-lg font-bold">{value.title}</p>
                <p>{value.description}</p>
                <p>{value.footer}</p>
              </div>
            </div>
            {/* <div className="p-2 px-4 inline-flex gap-2 items-center">
              <span className="">{value.footer}</span>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
