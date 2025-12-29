import PropTypes from 'prop-types';
import React from 'react';
import { Drawer, Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PerfectScrollbar from 'react-perfect-scrollbar';
import MenuList from './MenuList';
import { drawerWidth } from 'config.js';
import logo from 'assets/images/LogoBaru1.png';

const Sidebar = ({ drawerOpen, drawerToggle }) => {
  const theme = useTheme();
  const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

  const drawer = (
    <>
      {/* Logo untuk mobile */}
      {!matchUpMd && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 64,
            backgroundColor: theme.palette.primary.main
          }}
        >
          <img src={logo} alt="Logo" style={{ height: 40, width: 'auto' }} />
        </Box>
      )}

      <PerfectScrollbar
        style={{
          height: matchUpMd ? 'calc(100vh - 64px)' : 'calc(100vh - 64px)',
          paddingLeft: 16,
          paddingRight: 16
        }}
      >
        <MenuList />
      </PerfectScrollbar>
    </>
  );

  return (
    <Drawer
      variant={matchUpMd ? 'persistent' : 'temporary'}
      anchor="left"
      open={drawerOpen}
      onClose={drawerToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: matchUpMd ? 64 : 0,
          height: matchUpMd ? 'calc(100% - 64px)' : '100%',
          backgroundColor: theme.palette.primary.main,
          color: '#ffffff',
          borderRight: 'none',
          // Style untuk semua text dan icon di dalam sidebar
          '& .MuiListItemIcon-root': {
            color: '#ffffff'
          },
          '& .MuiListItemText-primary': {
            color: '#ffffff'
          },
          '& .MuiListItemText-secondary': {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          '& .MuiListItemButton-root': {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)'
              }
            }
          },
          '& .MuiTypography-root': {
            color: '#ffffff'
          },
          '& .MuiSvgIcon-root': {
            color: '#ffffff'
          }
        }
      }}
      ModalProps={{ keepMounted: true }}
    >
      {drawer}
    </Drawer>
  );
};

Sidebar.propTypes = {
  drawerOpen: PropTypes.bool,
  drawerToggle: PropTypes.func
};

export default Sidebar;