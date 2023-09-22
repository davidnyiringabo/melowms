import {
  BuildingOffice2Icon,
  Cog8ToothIcon,
  UsersIcon,
  ChartBarIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { GiCardboardBox, GiTakeMyMoney } from 'react-icons/gi';
import {
  MdMonetizationOn,
  MdOutlinePayments,
  MdPayments,
} from 'react-icons/md';
import { UserClaims } from '../types';

export type sideLink = {
  name: string;
  path: string;
  icon: any;
  claims?: UserClaims;
};

const sidebarData: sideLink[] = [
  {
    name: 'Dashboard',
    path: 'dashboard',
    icon: ChartBarIcon,
    claims: { manager: true, admin: true, superAdmin: false },
  },
  {
    name: 'Finances',
    path: 'grants',
    icon: GiTakeMyMoney,
    claims: { manager: false, admin: true, superAdmin: false },
  },
  {
    name: 'Warehouse',
    path: 'locations',
    icon: BuildingOffice2Icon,
    claims: { admin: false, manager: false, superAdmin: false },
  },
  // {
  //   name: "OverView",
  //   path: "overview",
  //   icon: ChartBarSquareIcon,
  // },
  {
    name: 'Stock',
    path: 'stock',
    icon: GiCardboardBox,
    claims: { manager: true, superAdmin: false },
  },
  {
    name: 'Sales',
    path: 'sales',
    icon: MdMonetizationOn,
    claims: { manager: true, admin: false, superAdmin: false },
  },
  {
    name: 'Management',
    path: 'manage',
    icon: UsersIcon,
  },
  {
    name: 'Expenses',
    path: 'expenses',
    icon: MdPayments,
    claims: { manager: true, admin: true, superAdmin: false },
  },
  {
    name: 'Notifications',
    path: 'notifications',
    icon: BellAlertIcon,
    claims: { admin: false, manager: false, superAdmin: false },
  },
  // {
  //   name: 'Settings',
  //   path: 'settings',
  //   claims: { manager: true, superAdmin: false, admin: false },
  //   icon: Cog8ToothIcon,
  // },
];

export default sidebarData;
