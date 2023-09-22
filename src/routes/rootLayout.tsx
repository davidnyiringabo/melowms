import { Outlet } from 'react-router-dom';
import Nav from '../components/Nav';
import SideBar from '../components/SideBar';

export default function RootLayout() {
  return (
    <div className="grid grid-cols-[auto,1fr] grid-rows-[auto,1fr]">
      <Nav />
      <SideBar open={true} onClose={() => null} />
      <div className="overflow-y-auto max-h-[calc(100vh-3.5rem)] w-full">
        <Outlet />
      </div>
    </div>
  );
}
