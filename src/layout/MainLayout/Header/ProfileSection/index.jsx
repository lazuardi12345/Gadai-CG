import React from 'react';
import { Button, Popper, Fade, Paper, ClickAwayListener, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance'; // Pastikan path ini benar
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import MeetingRoomTwoToneIcon from '@mui/icons-material/MeetingRoomTwoTone';

const ProfileSection = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

const handleLogout = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    await axiosInstance.post(
      '/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error('Logout failed:', err.response?.data || err);
  } finally {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.setItem('isAuthenticated', 'false');
    delete axiosInstance.defaults.headers.common['Authorization'];
    navigate('/login');
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
