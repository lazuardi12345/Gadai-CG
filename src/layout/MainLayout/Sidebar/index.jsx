import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { useMediaQuery, Divider, Drawer, Grid, Box } from '@mui/material';

// third party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project import
import MenuList from './MenuList';
import { drawerWidth } from 'config.js';

// assets
import logoDesktop from 'assets/images/LogoCG.jpeg';
import logoMobile from 'assets/images/LogoCG.jpeg';

// custom style
const Nav = styled((props) => <nav {...props} />)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    width: drawerWidth,
    flexShrink: 0
  }
}));

// ==============================|| SIDEBAR ||============================== //

const Sidebar = ({ drawerOpen, drawerToggle, window }) => {
  const theme = useTheme();
  const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

  // Konten drawer (sidebar)
  const drawer = (
    <>
      {/* Header untuk mobile */}
      <Box sx={{ display: { md: 'none', xs: 'block' } }}>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          sx={{
            ...theme.mixins.toolbar,
            background: theme.palette.primary.main,
            boxShadow:
              '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'
          }}
        >
          <Grid item>
            <img
              src={logoMobile}
              alt="Logo Mobile"
              style={{
                height: '40px',
                width: 'auto',
                marginTop: 4
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Header untuk desktop */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', p: 2 }}>
        <img
          src={logoDesktop}
          alt="Logo Desktop"
          style={{
            height: '60px',
            width: 'auto',
            marginBottom: 8
          }}
        />
      </Box>

      <Divider />

      {/* Isi menu dengan scrollbar */}
      <PerfectScrollbar style={{ height: 'calc(100vh - 90px)', padding: '10px' }}>
        <MenuList />
      </PerfectScrollbar>
    </>
  );

  // Target container
  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Nav>
      <Drawer
        container={container}
        variant={matchUpMd ? 'persistent' : 'temporary'}
        anchor="left"
        open={drawerOpen}
        onClose={drawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: '0 0.15rem 1.75rem 0 rgba(33, 40, 50, 0.15)',
            top: { md: 64, sm: 0 }
          }
        }}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>
    </Nav>
  );
};

Sidebar.propTypes = {
  drawerOpen: PropTypes.bool,
  drawerToggle: PropTypes.func,
  window: PropTypes.object
};

export default Sidebar;
