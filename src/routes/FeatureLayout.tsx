import { Outlet } from 'react-router-dom';
import ManageNav from '../components/ManageNav';
import { useLocation } from 'react-router-dom';
import SalesNav from '../components/SalesNav';

const FeatureLayout = () => {
  const location = useLocation();
  return (
    <div className="">
      {/* p-2 overflow-y-auto rounded mx-auto w-full max-h-[calc(100vh-3.5rem)] */}
      {location.pathname.startsWith('/sales') ? <SalesNav /> : <ManageNav />}
      <Outlet />
    </div>
  );
};

export default FeatureLayout;
