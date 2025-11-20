import React, { useContext, useEffect, useState, useRef } from 'react';
import { Button, Badge } from '@mui/material';
import NotificationsNoneTwoToneIcon from '@mui/icons-material/NotificationsNoneTwoTone';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';
import axiosInstance from 'api/axiosInstance';

const NotificationSection = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const userRole = (user?.role || '').toLowerCase();
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const [loading, setLoading] = useState(false);

    const lastNotifId = useRef(null);
    const hasPlayedSound = useRef(false);

    const notifSound = useRef(new Audio('/asset/sounds/notif.mp3'));

    const playNotificationSound = () => {
        try {
            const audio = notifSound.current;
            audio.currentTime = 0;
            audio.volume = 0.7;
            audio.play().catch(() => console.warn('Autoplay diblokir browser'));
        } catch (err) {
            console.error('Gagal memutar suara notif:', err);
        }
    };

    const getNotificationEndpoint = () => {
        if (userRole === 'checker') return '/checker/notifications/new';
        if (userRole === 'petugas') return '/petugas/notifications/new';
        if (userRole === 'admin') return '/admin/notifications/new';
        return '/notifications/new'; // HM
    };

    const getMarkReadEndpoint = () => {
        if (userRole === 'checker') return '/checker/notifications/mark-read';
        if (userRole === 'petugas') return '/petugas/notifications/mark-read';
        if (userRole === 'admin') return '/admin/notifications/mark-read';
        return '/notifications/mark-read'; // HM
    };

    // =========================
    // Cek notifikasi baru
    // =========================
    const fetchNewNotification = async () => {
        try {
            const res = await axiosInstance.get(getNotificationEndpoint());

            if (res.data.success) {
                const unreadNotifications = res.data.data.filter(n => !n.is_read);

                if (unreadNotifications.length === 0) {
                    // tidak ada unread → badge hilang
                    setHasNewNotification(false);
                    hasPlayedSound.current = false;
                    lastNotifId.current = null;
                } else {
                    // ada unread → badge merah tetap muncul
                    setHasNewNotification(true);

                    const latestId = unreadNotifications[0].id;

                    // bunyi hanya jika ada notif baru
                    if (!lastNotifId.current || latestId > lastNotifId.current) {
                        if (!hasPlayedSound.current) {
                            playNotificationSound();
                            hasPlayedSound.current = true;
                        }
                        lastNotifId.current = latestId;
                    }
                }
            }
        } catch (err) {
            console.error('Gagal cek notifikasi:', err);
        }
    };

    // =========================
    // Tandai notifikasi sudah dibaca
    // =========================
    const markNotificationsAsRead = async () => {
        try {
            const res = await axiosInstance.get(getNotificationEndpoint());
            const unreadIds = res.data.data.filter(n => !n.is_read).map(n => n.id);

            if (unreadIds.length > 0) {
                await axiosInstance.post(getMarkReadEndpoint(), { ids: unreadIds });
            }

            setHasNewNotification(false);
            hasPlayedSound.current = false;
            lastNotifId.current = null;
        } catch (err) {
            console.error('Gagal mark as read:', err);
        }
    };

    useEffect(() => {
        fetchNewNotification(); // cek 1x saat mount
    }, [userRole]);

    const handleClick = async () => {
        await markNotificationsAsRead();
        navigate('/notifications');
    };

    return (
        <Button color="inherit" onClick={handleClick} disabled={loading}>
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
