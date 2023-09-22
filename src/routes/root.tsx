import { useEffect } from 'react';
import ReactFireProvider from '../context/ReactFireProvider';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';

import { registerSW } from 'virtual:pwa-register';

const Root = () => {
  useEffect(() => {
    // add this to prompt for a refresh
    const updateSW = registerSW({
      onOfflineReady() {
        // alert(`You're now offline. Please go back online as soon as possible!`);
      },
      onNeedRefresh() {
        if (confirm('New updates available. Reload?')) {
          updateSW(true);
        }
      },
    });
  }, []);
  return (
    <div className="overflow-y-hidden ">
      <ReactFireProvider>
        <Toaster position="bottom-right" />
        <main className="flex flex-col min-h-screen">
          <Outlet />
        </main>
      </ReactFireProvider>
    </div>
  );
};

export default Root;
