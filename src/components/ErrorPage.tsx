import { useLocation, useNavigate, useRouteError } from 'react-router-dom';
import { MdError, MdRefresh } from 'react-icons/md';
import { useAuth } from 'reactfire';
import { useEffect } from 'react';

const ErrorComponent = ({ error }: any) => {
  const navigate = useNavigate();
  const routeError = useRouteError() as any;
  const auth = useAuth();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return navigate('/auth/login');
    });

    return unsub;
  }, [auth.currentUser]);

  return (
    <div className="font-bold rounded-md bg-red-50/30 border absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  shadow-md m-auto flex items-center flex-col justify-center max-w-[400px] mx-auto w-full text-2xl my-5 p-2">
      <h3 className="text-2xl text-red-500 w-full gap-3 text-center flex flex-col items-center font-bold my-5">
        <MdError className="text-5xl" /> <span>An error occured</span>
      </h3>
      <div className="text-sm mb-3 font-mono text-red-300 ">{error?.code}</div>
      <div className="text-red-500 text-lg flex flex-col items-center gap-10 w-fit ">
        {/* {error.message ? <>{error?.message}</> : 'Something went wrong!'} */}
        <p className="my-3 text-center">
          {routeError?.statusText || routeError?.message || ''}
        </p>
        <div className="flex gap-2 my-1">
          <a
            href={'/'}
            className="text-blue-500 flex items-center gap-2 border p-2 rounded border-blue-400 hover:bg-blue-200 text-sm underline"
          >
            &larr; Go home
          </a>
          <button
            onClick={() => navigate(0)}
            className="text-blue-500 flex items-center border p-2 rounded border-blue-400 hover:bg-blue-200 text-sm underline"
          >
            <MdRefresh className="text-md" /> Reload
          </button>
          {auth.currentUser && (
            <button
              onClick={async () => {
                await auth.signOut();
                navigate(0);
              }}
              className="text-blue-500 flex items-center border p-2 rounded border-blue-400 hover:bg-blue-200 text-sm underline"
            >
              <MdRefresh className="text-md" /> Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorComponent;
