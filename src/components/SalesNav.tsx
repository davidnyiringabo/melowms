import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { TabLink } from '../types';
import withAuthorization from './hocs/withAuthorization';
import {
  MdContactSupport,
  MdContacts,
  MdFireTruck,
  MdMonetizationOn,
} from 'react-icons/md';
import { useCustomAuth } from '../context/Auth';

const SalesNav = () => {
  const location = useLocation();
  const { transCount: count } = useCustomAuth();

  const tabs: TabLink[] = [
    {
      name: `Sell`,
      href: '/sales',
      icon: <MdMonetizationOn />,
    },
    {
      name: `Transfer`,
      href: '/sales/transfer',
      icon: <MdFireTruck />,
    },
    {
      name: `Customers`,
      href: '/sales/customers',
      icon: <MdContacts />,
    },
    // {
    //   name: `All Transfers`,
    //   href: '/sales/transfers',
    // },
    // {
    //   name: `Orders`,
    //   href: '/sales/orders',
    // },
  ];

  return tabs.length > 0 ? (
    <div className="text-sm mx-auto w-full font-medium text-center text-gray-500 border-b border-gray-200  ">
      <ul className="flex flex-wrap items-end w-full -mb-px">
        {tabs.map((tab) => {
          const MyLink = withAuthorization({
            requiredClaims: tab.claims || {},
            all: false,
            quiet: true,
          })(() => (
            <li key={tab.href} className="mr-2">
              {location.pathname.replace(/\/$/, '') !==
              tab.href.replace(/\/$/, '') ? (
                <Link
                  to={tab.href}
                  className="inline-flex gap-2 items-center  p-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300"
                >
                  {tab.icon}
                  {tab.name}
                  {tab.name === 'Transfer' && count > 0 ? (
                    <span
                      className={`border border-red-400 rounded-full  h-6 w-6 flex justify-center items-center bg-red-100 text-red-500 font-extrabold `}
                    >
                      {count}
                    </span>
                  ) : (
                    <></>
                  )}
                </Link>
              ) : (
                <Link
                  to={tab.href}
                  className="inline-flex relative items-center gap-2 p-4 py-2 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active  "
                  aria-current="page"
                >
                  {tab.icon}
                  {tab.name}
                  {tab.name === 'Transfer' && count > 0 ? (
                    <span
                      className={`border border-red-400 rounded-full h-6 w-6 flex justify-center items-center bg-red-100 text-red-500 font-extrabold `}
                    >
                      {count}
                    </span>
                  ) : (
                    <></>
                  )}
                </Link>
              )}
            </li>
          ));
          return <MyLink key={tab.href} />;
        })}

        {/* <li>
            <a className="inline-block p-4 text-gray-400 rounded-t-lg cursor-not-allowed ">Disabled</a>
        </li> */}
      </ul>
    </div>
  ) : (
    <></>
  );
};

export default SalesNav;
