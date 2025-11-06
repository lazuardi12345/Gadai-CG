import React, { useContext, useState, useRef } from 'react';
import { Button, Popper, Fade, Paper, ClickAwayListener, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import MeetingRoomTwoToneIcon from '@mui/icons-material/MeetingRoomTwoTone';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from 'AuthContex/AuthContext';

const ProfileSection = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext); // Ambil user dan logout dari context
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => setOpen(prev => !prev);
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Opsional: logout ke server
      const token = localStorage.getItem('auth_token');
      await axiosInstance.post(
        '/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Logout failed:', err.response?.data || err);
    } finally {
      // Pakai logout dari AuthContext supaya bersih
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <Button
        ref={anchorRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        color="inherit"
      >
        <AccountCircleTwoToneIcon />
      </Button>

      <Popper open={open} anchorEl={anchorRef.current} transition disablePortal>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <List>
                  <ListItemButton disabled>
                    <ListItemIcon>
                      <AccountCircleTwoToneIcon />
                    </ListItemIcon>
                    <ListItemText primary={user?.name || 'User'} secondary={user?.role || '-'} />
                  </ListItemButton>
                  <ListItemButton onClick={handleLogout}>
                    <ListItemIcon>
                      <MeetingRoomTwoToneIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </List>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default ProfileSection;
