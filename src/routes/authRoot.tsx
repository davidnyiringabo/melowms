import { Outlet } from 'react-router-dom';
import AuthNav from '../components/AuthNav';

const AuthLayout = () => {
  return (
    <div className="flex-1 justify-center min-h-full flex flex-col items-center">
      <AuthNav />
      <Outlet />
    </div>
  );
};

export default AuthLayout;
