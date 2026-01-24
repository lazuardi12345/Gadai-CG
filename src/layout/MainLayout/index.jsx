import React from 'react';
import { Outlet } from 'react-router-dom';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import { useMediaQuery, AppBar, Box, Toolbar } from '@mui/material';

// project import
import { drawerWidth } from 'config.js';
import Header from './Header';
import Sidebar from './Sidebar';

// custom style
const Main = styled((props) => <main {...props} />)(({ theme, open }) => ({
  width: '100%',
  minHeight: '100vh',
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  marginLeft: 0,
  [theme.breakpoints.up('md')]: {
    marginLeft: open ? `${drawerWidth}px` : 0,
    width: open ? `calc(100% - ${drawerWidth}px)` : '100%'
  }
}));

const OutletDiv = styled((props) => <div {...props} />)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2)
  },
  padding: theme.spacing(3)
}));


const MainLayout = () => {
  const theme = useTheme();
  const matchUpLg = useMediaQuery(theme.breakpoints.up('lg'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  React.useEffect(() => {
    setDrawerOpen(matchUpLg);
  }, [matchUpLg]);

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: '100%',
          backgroundColor: '#ffffff',
          color: theme.palette.text.primary,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <Header drawerOpen={drawerOpen} drawerToggle={handleDrawerToggle} />
        </Toolbar>
      </AppBar>
      
      <Sidebar drawerOpen={drawerOpen} drawerToggle={handleDrawerToggle} />

      <Main
        open={drawerOpen}
        style={{
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
          })
        }}
      >
        <Toolbar />
        
        <OutletDiv>
          <Outlet />
          <Box sx={{ mt: 5 }}>
            Distributed by{' '}
            <a href='https://sentragadaiindonesia.com/' target='_blank' rel='noopener noreferrer'>
              SENTRA GADAI INDONESIA
            </a>
          </Box>
        </OutletDiv>
      </Main>
    </Box>
  );
};

export default MainLayout;