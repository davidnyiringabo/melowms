import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import { EntryType } from '../helpers/statsTree';

export type statisticsCard = {
  icon: any;
  name: EntryType;
  title: string;
  value: string;
  footer: {
    value: string;
    label: string;
  };
  moreInfo?: { key: string; value: string };
};

// export const statisticsCardsData: statisticsCard[] = [
//   {
//     icon: ShoppingCartIcon,
//     title: 'Stock',
//     value: '53,000 RWF',
//     footer: {
//       value: '+55%',
//       label: 'In Stock',
//     },
//   },
//   {
//     icon: CurrencyDollarIcon,
//     title: 'Sales',
//     value: '2,300',
//     footer: {
//       value: '+3%',
//       label: 'Today',
//     },
//   },
//   {
//     icon: WalletIcon,
//     title: 'Expenses',
//     value: '3,462',
//     footer: {
//       value: '-2%',
//       label: 'lorem ipsum',
//     },
//   },
// ];

// export default statisticsCardsData;
