import React, { useContext, useState, useRef } from 'react';
import { 
  Button, Popper, Fade, Paper, ClickAwayListener, 
  List, ListItemButton, ListItemIcon, ListItemText, 
  Typography, Divider, Box, Avatar 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import MeetingRoomTwoToneIcon from '@mui/icons-material/MeetingRoomTwoTone';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from 'AuthContex/AuthContext';

const ProfileSection = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext); 
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => setOpen(prev => !prev);
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Panggil endpoint logout BE
      await axiosInstance.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state & localstorage lewat context
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <Button
        ref={anchorRef}
        onClick={handleToggle}
        color="inherit"
        sx={{ borderRadius: '8px', textTransform: 'none', gap: 1 }}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '1rem' }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
          <Typography variant="body2" fontWeight="bold" lineHeight={1}>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
            {user?.role_name} {/* <--- PAKAI ROLE_NAME DARI JSON BARU */}
          </Typography>
        </Box>
      </Button>

      <Popper 
        open={open} 
        anchorEl={anchorRef.current} 
        transition 
        disablePortal 
        placement="bottom-end"
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Paper elevation={8} sx={{ mt: 1.5, minWidth: 200, borderRadius: 2 }}>
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {user?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {user?.email}
                    </Typography>
                    {/* Badge Role */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'inline-block', 
                        mt: 1, 
                        px: 1, 
                        py: 0.2, 
                        bgcolor: 'info.light', 
                        color: 'info.contrastText', 
                        borderRadius: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      {user?.role_name}
                    </Typography>
                  </Box>
                  
                  <Divider />

                  <List sx={{ p: 0 }}>
                    <ListItemButton onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                      <ListItemIcon sx={{ color: 'error.main', minWidth: 35 }}>
                        <MeetingRoomTwoToneIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Logout" 
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} 
                      />
                    </ListItemButton>
                  </List>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default ProfileSection;