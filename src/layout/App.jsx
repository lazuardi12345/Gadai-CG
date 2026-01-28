import React, { useContext } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import theme from 'themes';
import Routes from 'routes/index';
import NavigationScroll from './NavigationScroll';
import { AuthContext } from 'AuthContex/AuthContext';

// 1. IMPORT BadgeProvider yang baru saja kita buat
import { BadgeProvider } from 'contexts/BadgeContext'; 

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
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme(customization)}>
        <CssBaseline />
        {/* 2. BUNGKUS SEMUA DENGAN BadgeProvider */}
        <BadgeProvider> 
          <NavigationScroll>
            {/* 3. NotificationListener diletakkan di dalam Provider */}
            <NotificationListener />
            <Routes />
          </NavigationScroll>
        </BadgeProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;