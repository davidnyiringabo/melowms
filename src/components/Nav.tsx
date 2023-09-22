/* eslint-disable @next/next/no-img-element */

import { Link, useNavigate } from 'react-router-dom';
import { useCustomAuth } from '../context/Auth';
import { useAuth, useFirestoreCollectionData, useFunctions } from 'reactfire';
import {
  MdAccountCircle,
  MdArrowDropDownCircle,
  MdArrowForward,
  MdSwitchAccount,
  MdVerified,
} from 'react-icons/md';
import { useEffect, useRef, useState } from 'react';
import { Branches, Companies } from '../database';
import Spinner from './Spinner';
import { Branch, SwitchInfo } from '../types';
import { CollectionReference } from 'firebase/firestore';
import Modal from './Modal';
import { httpsCallable } from 'firebase/functions';
import cloudFunctionNames from '../functionNames';
import { toast } from 'react-hot-toast';

const Nav = () => {
  const [open, setOpen] = useState(false);

  const { isAdmin, isSwitched, isSuperAdmin, branchData, isManager, company } =
    useCustomAuth();
  const auth = useAuth();
  return (
    <header className="pl-3 items-center py-2 sticky top-0 bg-blue-900 flex justify-between border-b-2 z-50 text-white">
      <div className="text-2xl gap-2 flex flex-col md:flex-row md:items-center items-start text-center">
        <span className="inline-block px-2 font-extrabold">
          Melo<span className="text-blue-500">WMS</span>
        </span>
        <div className="flex gap-2 pr-2 ">
          {company && (
            <span className="flex pl-2 items-center gap-2 text-xs text-blue-400">
              {'  '} Company:{' '}
              <span className="text-blue-200 break-keep text-xs">
                {company.name}
              </span>
            </span>
          )}
          {branchData && (
            <div className="flex  flex-row pl-2 items-center w-fit flex-1 gap-2 text-xs text-blue-400">
              <div>{'  '} Branch: </div>
              <div className="text-blue-200 flex-1 flex break-keep text-xs">
                {branchData.name.split(' ').map((n) => (
                  <span className="mr-1" key={n}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex px-2 gap-2 justify-end">
        <div className="flex rounded-2xl border border-blue-200 bg-blue-300/30 gap-6 px-2 py-1 items-center">
          <div className="flex flex-col gap-1 test-sm mx-1">
            <span className="text-xs">{auth.currentUser?.email}</span>
            <span className="flex items-center gap-2 text-xs text-blue-400">
              {'  '} Role:{' '}
              <span className="text-blue-200 text-xs">
                {isSuperAdmin
                  ? 'SuperAdmin'
                  : isAdmin
                  ? 'Admin'
                  : isManager
                  ? 'Manager'
                  : ''}
              </span>
            </span>
          </div>
          <Link
            to="#!"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((p) => !p);
            }}
            className="relative flex pr-2 items-center gap-1 hover:bg-blue-400 rounded-full bg-blue-300/50 p-1"
          >
            <MdAccountCircle className="text-3xl" />
            {(isAdmin || isSwitched) && (
              <>
                <MdArrowDropDownCircle />
                {open && (
                  <DropDown onClose={() => setOpen(false)} open={open} />
                )}
              </>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export function DropDown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [dOpen, setDOpen] = useState(false);
  const dropRef = useRef<any>();
  useEffect(() => {
    const element = dropRef.current as HTMLDivElement;
    const listener = (ev: MouseEvent) => {
      if (!(ev.target as HTMLElement).closest('#navdropdown')) {
        onClose();
      }
    };

    window.addEventListener('click', listener);
    return () => {
      window.removeEventListener('click', listener);
    };
  }, []);
  return (
    <div
      id="navdropdown"
      ref={dropRef}
      onClick={(e) => e.stopPropagation()}
      className={`z-10 ${
        open ? '' : 'hidden'
      } bg-white absolute top-full right-0 divide-y divide-blue-100 rounded-lg shadow w-52 dark:bg-blue-700`}
    >
      <ul
        className="py-2 text-sm text-blue-700 dark:text-blue-200"
        aria-labelledby="dropdownDefaultButton"
      >
        <li>
          <a
            onClick={() => setDOpen((p) => !p)}
            href="#"
            className=" flex font-bold text-white items-center gap-2 px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-600 dark:hover:text-white"
          >
            <MdSwitchAccount className="text-2xl" />
            Switch Account
            <MdArrowDropDownCircle />
          </a>
          {dOpen && <SwitchToAccount />}
        </li>
      </ul>
    </div>
  );
}

function SwitchToAccount() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { reloadUser, isSwitched, isAdmin } = useCustomAuth();

  const switchFromAccount = httpsCallable(
    useFunctions(),
    cloudFunctionNames.switchFromAccount
  );

  const handleSwitchBack = async () => {
    try {
      setLoading(true);
      await switchFromAccount();
      await reloadUser();
      setLoading(false);
      navigate('/', { replace: true });
      navigate(0);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  return isAdmin ? (
    <SwitchToBranchComponent />
  ) : isSwitched ? (
    <>
      <ul className="bg-blue-500/40 flex flex-col gap-1 p-1">
        <li>
          <a
            href="#"
            onClick={handleSwitchBack}
            className=" border flex font-bold justify-between rounded text-white items-center gap-2 px-4 py-2 hover:bg-blue-200 dark:hover:bg-blue-700 dark:hover:text-white"
          >
            {loading && <Spinner small />}
            Switch Back
            <MdArrowForward />
          </a>
        </li>
      </ul>
    </>
  ) : (
    <p>Nothing to see.</p>
  );
}

const SwitchToBranchComponent = () => {
  const [branch, setBranch] = useState<Branch>();
  const { tinnumber, reloadUser } = useCustomAuth();
  const { status, data } = useFirestoreCollectionData<Branch>(
    Companies.doc(tinnumber as string).sub(Branches)
      .ref as CollectionReference<Branch>,
    { idField: 'id' }
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const switchToAccount = httpsCallable<SwitchInfo>(
    useFunctions(),
    cloudFunctionNames.switchToAccount
  );
  const handleSwitch = async () => {
    try {
      if (branch) {
        setLoading(true);
        await switchToAccount({ branch: branch.id });
        await reloadUser();
        setLoading(false);
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <>
      {branch && (
        <Modal
          title={`Switch to "${branch.name}"`}
          onClose={() => setBranch(undefined)}
          open={!!branch}
        >
          <p className="text-lg text-black my-7">
            Continue to
            <span className="font-bold ml-1">"{branch.name}"</span>?
          </p>
          <button onClick={handleSwitch} className="btn">
            {loading && <Spinner small />}
            Confirm Switch
            <MdArrowForward />
          </button>
        </Modal>
      )}
      {status === 'loading' && <Spinner small />}
      <ul className="bg-blue-500/40 flex flex-col gap-1 p-1">
        <li className="text-gray-200 mb-1 px-4 py-2 bg-gray-300/20">
          Choose Branch
        </li>
        {data &&
          data.map((branch) => (
            <li key={branch.id}>
              <a
                href="#"
                onClick={() => setBranch(branch)}
                className=" border flex font-bold justify-between rounded text-white items-center gap-2 px-4 py-2 hover:bg-blue-200 dark:hover:bg-blue-700 dark:hover:text-white"
              >
                {branch.name}
                <MdArrowForward />
              </a>
            </li>
          ))}
      </ul>
    </>
  );
};

export default Nav;
