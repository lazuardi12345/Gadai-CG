import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Stack } from '@mui/material';

// project import
import SearchSection from './SearchSection';
import ProfileSection from './ProfileSection';
import NotificationDropdown from './NotificationSection/NotificationDropdown';
import { drawerWidth } from 'config.js';

// assets
import MenuTwoToneIcon from '@mui/icons-material/MenuTwoTone';
import logo from 'assets/images/LogoBaru1.png';

// ==============================|| HEADER ||============================== //

const Header = ({ drawerToggle }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {/* Left Section - Logo & Menu */}
      <Box sx={{ width: drawerWidth, zIndex: 1201 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* Logo - Hidden on mobile */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 0.5 }}>
            <img
              src={logo}
              alt="Logo"
              style={{
                height: '68px',
                width: 'auto',
                display: 'block'
              }}
            />
          </Box>

          {/* Hamburger Menu */}
          <IconButton
            edge="start"
            sx={{ mr: theme.spacing(1.25) }}
            color="inherit"
            aria-label="open drawer"
            onClick={drawerToggle}
            size="large"
          >
            <MenuTwoToneIcon sx={{ fontSize: '1.5rem' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Right Section */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <SearchSection theme="light" />
        <NotificationDropdown />
        <ProfileSection />
      </Stack>
    </Box>
  );
};

Header.propTypes = {
  drawerToggle: PropTypes.func
};

export default Header;