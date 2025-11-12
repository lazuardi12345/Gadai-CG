import React, { useContext, useEffect, useState, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Badge } from '@mui/material';
import NotificationsNoneTwoToneIcon from '@mui/icons-material/NotificationsNoneTwoTone';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';
import axiosInstance from 'api/axiosInstance';

const NotificationSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const userRole = (user?.role || '').toLowerCase();
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastNotifId = useRef(null);

  // ======================
  // PRELOAD SOUND
  // ======================
  // ✅ Gunakan useRef agar tidak buat objek audio baru setiap kali
  const notifSound = useRef(new Audio('/asset/sounds/notif.mp3')); 
  // path HARUS diawali '/' karena file di folder public (bukan relatif)

  const playNotificationSound = () => {
    try {
      const audio = notifSound.current;
      audio.currentTime = 0; // reset ke awal agar bisa diputar berulang
      audio.volume = 0.7;
      audio.play().catch(() => {
        console.warn('Autoplay diblokir browser, user perlu interaksi dulu.');
      });
    } catch (err) {
      console.error('Gagal memutar suara notif:', err);
    }
  };

  // ======================
  // FETCH NOTIFICATION
  // ======================
  const fetchNewNotification = async () => {
    try {
      setLoading(true);
      let url = '/notifications';

      // arahkan endpoint berdasarkan role
      if (userRole === 'checker') url = '/checker/notifications';
      else if (userRole === 'hm') url = '/notifications';
      else if (userRole === 'petugas') url = '/petugas/notifications';

      const res = await axiosInstance.get(url);

      if (res.data.success && res.data.data.length > 0) {
        const latestId = res.data.data[0].id;

        if (!lastNotifId.current) {
          lastNotifId.current = latestId;
        } else if (latestId !== lastNotifId.current) {
          // jika ada notifikasi baru
          setHasNewNotification(true);
          playNotificationSound(); 
          lastNotifId.current = latestId;
        }
      }
    } catch (err) {
      console.error('Gagal cek notifikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewNotification();
    const interval = setInterval(fetchNewNotification, 5000); // cek tiap 5 detik
    return () => clearInterval(interval);
  }, [userRole]);

  // ======================
  // HANDLE CLICK ICON
  // ======================
  const handleClick = () => {
    setHasNewNotification(false);
    navigate('/notifications');
  };

  // ======================
  // RENDER
  // ======================
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
