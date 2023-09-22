import React, { ReactNode, useState } from 'react';

type Tab = { name: string; icon: ReactNode; link?: string };

const Tabs = ({
  tabs,
  onTabChange,
  className = '',
}: {
  onTabChange: (tab: Tab, idx: number) => void;
  tabs: Tab[];
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <div
      className={`text-sm mx-auto w-full font-medium text-center text-gray-500 border-b border-gray-200 ${className}`}
    >
      <ul className="flex flex-wrap w-full -mb-px">
        <li>
          {tabs.map((tab, i) => (
            <button
              key={tab.name}
              onClick={() => {
                setActiveTab(i);
                onTabChange(tab, i);
              }}
              className={`inline-flex items-center gap-2 ${
                activeTab !== i
                  ? `p-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300`
                  : ` p-4 py-2 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active `
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </li>
      </ul>
    </div>
  );
};

export default Tabs;
