import { useEffect, useState } from 'react';

import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import SideLink from './header/SideLink';
import sidebarData from '../data/sidebar-data';
import { useAuth } from 'reactfire';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '../context/Auth';
import { DocNode, Transfers } from '../database';
import { getCountFromServer, query, where } from 'firebase/firestore';
import { OrderStatus } from '../types';

type SideBarProps = {
  open: boolean;
  onClose: () => void;
};

const SideBar = (props: SideBarProps) => {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const { transCount: count } = useCustomAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(!!props.open);
  }, [props.open]);

  const handleClose = () => {
    setOpen(!open);
    props.onClose && props.onClose();
  };

  return (
    <div
      className={`${
        open ? 'w-64  bg-blue-800' : 'w-20 bg-blue-700 items-center'
      } row-start-1 transition-all min-h-screen  row-span-2 relative p-5 flex flex-col justify-between`}
    >
      <div>
        <div className="flex flex-col gap-5 text-white">
          <button
            className="hover:bg-blue-300 rounded p-1 w-fit"
            onClick={handleClose}
          >
            <Bars3Icon className="w-10 h-10" />
          </button>
          {open && (
            <span className="block font-bold leading-5 text-white">
              Hi, {auth.currentUser?.displayName}
            </span>
          )}
        </div>
        <div className="mt-10">
          {sidebarData.map((value, index) => (
            <SideLink open={open} key={index} count={count} link={value} />
          ))}
        </div>
      </div>
      <div className="border-t-2 py-5">
        <button
          onClick={async () => {
            await auth.signOut();
            navigate(0);
          }}
          className={`${
            open ? 'pr-10 ' : ''
          } text-white icon-button-filled w-full flex gap-3 cursor-pointer hover:bg-blue-100 py-3 px-2 rounded`}
        >
          <ArrowRightOnRectangleIcon className="w-10 h-10" />
          {open && (
            <span className="font-semibold inline-flex items-center">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SideBar;
