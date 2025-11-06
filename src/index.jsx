import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'AuthContex/AuthContext';

// assets
import 'assets/scss/style.scss';

// third party
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

// project import
import App from 'layout/App';
import reducer from 'store/reducer';
import * as serviceWorker from 'serviceWorker';

const store = configureStore({ reducer });
const root = createRoot(document.getElementById('root'));

// ==============================|| MAIN - REACT DOM RENDER  ||==============
root.render(
  <Provider store={store}>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.VITE_APP_BASE_NAME}>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </Provider>
);

serviceWorker.register();
