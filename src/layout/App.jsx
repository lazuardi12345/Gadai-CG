import React, { useContext } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// project import
import theme from 'themes';
import Routes from 'routes/index';
import NavigationScroll from './NavigationScroll';
import { AuthContext } from 'AuthContex/AuthContext';

// IMPORT INI (Pastikan kamu sudah buat filenya)
import NotificationListener from '../views/Notifications/NotificationListener'; 

const App = () => {
  const customization = useSelector((state) => state.customization);
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <NavigationScroll>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme(customization)}>
          <CssBaseline />
          
          {/* PASANG DI SINI */}
          <NotificationListener />
          
          <Routes />
        </ThemeProvider>
      </StyledEngineProvider>
    </NavigationScroll>
  );
};

export default App;