import React, { lazy } from 'react';

// project imports
import Loadable from 'component/Loadable';
import MinimalLayout from 'layout/MinimalLayout';

// lazy load halaman login & register
const AuthLogin = Loadable(lazy(() => import('views/Login')));
const AuthRegister = Loadable(lazy(() => import('views/Register')));

// ==============================|| AUTHENTICATION ROUTES ||============================== //

const AuthenticationRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    {
      path: 'login', 
      element: <AuthLogin />
    },
    {
      path: 'register', 
      element: <AuthRegister />
    }
  ]
};

export default AuthenticationRoutes;
