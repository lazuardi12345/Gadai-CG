import React, { useContext, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Badge } from '@mui/material';
import NotificationsNoneTwoToneIcon from '@mui/icons-material/NotificationsNoneTwoTone';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';
import axiosInstance from 'api/axiosInstance';

const NotificationSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasNewNotification, setHasNewNotification, user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();
  const [loading, setLoading] = useState(false);

  const fetchNewNotification = async () => {
    try {
      let url = '/notifications';
      if (userRole === 'checker') url = '/checker/notifications';
      else if (userRole === 'petugas') url = '/petugas/notifications';

      const res = await axiosInstance.get(url);
      if (res.data.success && res.data.data.length > 0) {
        // Cek apakah ada yang belum dibaca
        const adaBaru = res.data.data.some((n) => !n.is_read);
        setHasNewNotification(adaBaru);
      }
    } catch (err) {
      console.error('Gagal cek notifikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewNotification();
    const interval = setInterval(fetchNewNotification, 5000);
    return () => clearInterval(interval);
  }, [userRole]);

  const handleClick = () => {
    setHasNewNotification(false); // hilangkan tanda merah
    navigate('/notifications');   // buka halaman notifikasi
  };

  return (
    <Button
      sx={{ minWidth: { sm: 50, xs: 35 } }}
      color="inherit"
      onClick={handleClick}
      disabled={loading}
    >
      <Badge
        color="error"
        variant="dot"
        invisible={!hasNewNotification}
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <NotificationsNoneTwoToneIcon sx={{ fontSize: '1.5rem' }} />
      </Badge>
    </Button>
  );
};

export default NotificationSection;
