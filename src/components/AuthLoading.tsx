'use client';
import { useSigninCheck } from 'reactfire';
import Spinner from './Spinner';
import logo from '../assets/icon-384x384.png';

const AuthLoadingScreen = ({ children }: { children: React.ReactNode }) => {
  const { status, data: signInCheckResult } = useSigninCheck();

  return (
    <>
      <div
        className={`${
          status !== 'success' ? 'z-50 fixed flex' : 'hidden z-0'
        } inset-0 bg-white w-full h-full overflow-hidden items-center justify-center min-h-screen`}
      >
        {status === 'loading' && <Spinner />}
        {status === 'error' && <Error error={signInCheckResult.errors} />}
      </div>
      {status === 'success' && children}
    </>
  );
};

const Error = ({ error }: { error: any }) => {
  return (
    <div className="font-bold max-w-[400px] mx-auto w-full text-2xl my-5 p-2 block">
      <div className="text-sm mb-5 font-mono text-red-300 ">{error.code}</div>
      <div className="text-red-500 ">
        {error.message ? <>{error.message}</> : 'Something went wrong!'}
      </div>
    </div>
  );
};

export default AuthLoadingScreen;

export const LoadingScreen = () => {
  return (
    <div
      className={`? "z-50 fixed flex inset-0 bg-gradient-to-br from-white to-blue-400 w-full h-full overflow-hidden items-center justify-center min-h-screen`}
    >
      <div className="flex flex-col h-40 w-fit gap-1 p-2 justify-center items-center">
        <img className="w-24  h-2w-24" src={logo} alt="Melo WMS" />
        <Spinner />
      </div>
    </div>
  );
};
