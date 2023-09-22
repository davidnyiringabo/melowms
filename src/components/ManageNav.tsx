import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useCustomAuth } from '../context/Auth';
import { TabLink } from '../types';
import withAuthorization from './hocs/withAuthorization';

const ManageNav = () => {
  const location = useLocation();
  const { isSuperAdmin } = useCustomAuth();

  const stockTabs: TabLink[] = [
    { name: 'Stock', href: '/stock' },
    // { name: 'Items', href: '/stock/items' },
    {
      name: 'Emballage',
      href: '/stock/emballage',
      claims: { manager: true, admin: true },
    },
    {
      name: 'Damages',
      href: '/stock/damages',
      claims: { manager: true, admin: true },
    },
    {
      name: 'Requisition',
      href: '/stock/invoices',
      claims: { manager: true, admin: true },
    },
    // {
    //   name: 'Locations',
    //   href: '/stock/locations',
    //   claims: { manager: true, admin: true },
    // },
  ];
  const usersTabs: TabLink[] = [
    {
      name: `${isSuperAdmin ? 'Companies' : 'Branches'}`,
      href: '/manage',
      claims: { admin: true },
    },
    {
      name: 'Users',
      href: '/manage/users',
      claims: { admin: true, manager: true },
    },
    {
      name: 'Roles',
      href: '/manage/roles',
      claims: { manager: true },
    },
    {
      name: 'Permissions',
      href: '/manage/permissions',
      claims: { superAdmin: true },
    },
  ];

  const tabs = location.pathname.startsWith('/stock')
    ? stockTabs
    : location.pathname.startsWith('/manage')
    ? usersTabs
    : [];
  return tabs.length > 0 ? (
    <div className="text-sm mx-auto w-full font-medium text-center text-gray-500 border-b border-gray-200  ">
      <ul className="flex flex-wrap w-full -mb-px">
        {tabs.map((tab) => {
          const MyLink = withAuthorization({
            requiredClaims: tab.claims || {},
            all: false,
            quiet: true,
          })(() => (
            <li key={tab.href} className="mr-2">
              {location.pathname !== tab.href ? (
                <Link
                  to={tab.href}
                  className="inline-block p-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300"
                >
                  {tab.name}
                </Link>
              ) : (
                <Link
                  to={tab.href}
                  className="inline-block p-4 py-2 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active  "
                  aria-current="page"
                >
                  {tab.name}
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

export default ManageNav;
