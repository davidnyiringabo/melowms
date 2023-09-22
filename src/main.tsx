import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ErrorComponent from './components/ErrorPage';
import './index.css';

import {
  createBrowserRouter,
  useNavigate,
  RouterProvider,
} from 'react-router-dom';
import Root from './routes/root';
import AuthLayout from './routes/authRoot';
import Login from './routes/auth/login';
import RootLayout from './routes/rootLayout';
import Index from './components/dashboard/Index';
import {
  UsersPage,
  RolesPage,
  CompaniesPage,
  PermissionsPage,
} from './routes/manage';
import {
  InventoryPage,
  ItemsPage,
  LocationsPage,
  SuppliersPage,
  InvoicesPage,
} from './routes/stock';
import FeatureLayout from './routes/FeatureLayout';
import CustomersPage from './routes/sales/customers';
import SalesPanelPage from './routes/sales/salespanel';
import OrdersPage from './routes/orders/orders';
import TransferPanel from './routes/sales/transfer';
import { TransferPage } from './routes/transfers';
import { useCustomAuth } from './context/Auth';
import SettingsPage from './routes/settings/settingsPage';
import ResetPasswordPage from './routes/auth/resetPassword';
import VerifyEmailPage from './routes/auth/verifyEmail';
import Finances from './routes/finances/Finances';
import app, { auth } from './firebaseConfig';
import { AuthProvider, FirebaseAppProvider } from 'reactfire';
import ExpensesPage from './routes/expenses/ExpensesPage';
import EmptiesPage from './routes/stock/empties';
import Damages from './routes/stock/damages';

const RedirectToDashboard = () => {
  const { isSuperAdmin } = useCustomAuth();
  const navigate = useNavigate();
  useEffect(() => {
    navigate(isSuperAdmin ? '/manage' : '/dashboard');
  }, []);
  return <></>;
};

const router = createBrowserRouter([
  {
    path: '',
    element: <Root />,
    errorElement: (
      <FirebaseAppProvider firebaseApp={app}>
        <AuthProvider sdk={auth}>
          <ErrorComponent />
        </AuthProvider>
      </FirebaseAppProvider>
    ),
    children: [
      {
        path: 'auth/',
        element: <AuthLayout />,
        children: [
          { path: 'login/', element: <Login /> },
          { path: 'reset-password/', element: <ResetPasswordPage /> },
          { path: 'verify-email/', element: <VerifyEmailPage /> },
        ],
      },
      {
        path: '/',
        element: <RootLayout />,
        children: [
          { path: '', element: <RedirectToDashboard /> },
          { path: 'dashboard/', element: <Index /> },
          { path: 'grants/', element: <Finances /> },
          { path: 'settings/', element: <SettingsPage /> },
          { path: 'expenses/', element: <ExpensesPage /> },
          {
            path: '',
            element: <FeatureLayout />,
            children: [
              {
                path: 'manage/',
                children: [
                  { path: 'users/', element: <UsersPage /> },
                  { path: 'roles/', element: <RolesPage /> },
                  { path: '', index: true, element: <CompaniesPage /> },
                  { path: 'permissions/', element: <PermissionsPage /> },
                ],
              },
              {
                path: 'stock/',
                children: [
                  { path: '', element: <InventoryPage /> },
                  { path: 'suppliers', element: <SuppliersPage /> },
                  { path: 'invoices', element: <InvoicesPage /> },
                  { path: 'emballage', element: <EmptiesPage /> },
                  { path: 'damages', element: <Damages /> },
                  { path: 'items', element: <ItemsPage /> },
                ],
              },
              { path: '/locations', element: <LocationsPage /> },
              {
                path: '/sales',
                children: [
                  { path: 'orders', element: <OrdersPage /> },
                  { path: 'transfer', element: <TransferPanel /> },
                  { path: 'transfers', element: <TransferPage /> },
                  { path: 'customers', element: <CustomersPage /> },
                  { path: '', element: <SalesPanelPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
