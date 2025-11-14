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
    
    // lastNotifId menyimpan ID notifikasi terbaru yang sudah diproses.
    const lastNotifId = useRef(null); 

    // Audio untuk notifikasi
    const notifSound = useRef(new Audio('/asset/sounds/notif.mp3')); 

    /**
     * @description Memutar suara notifikasi.
     */
    const playNotificationSound = () => {
        try {
            const audio = notifSound.current;
            audio.currentTime = 0;
            audio.volume = 0.7;
            audio.play().catch(() => {
                console.warn('Autoplay diblokir browser, user perlu interaksi dulu.');
            });
        } catch (err) {
            console.error('Gagal memutar suara notif:', err);
        }
    };

    /**
     * @description Menentukan endpoint API notifikasi berdasarkan role.
     */
    const getNotificationEndpoint = () => {
        if (userRole === 'checker') return '/checker/notifications';
        if (userRole === 'petugas') return '/petugas/notifications';
        // HM, Admin, atau Default
        return '/notifications'; 
    };

    // ======================
    // FETCH NOTIFICATION (Cek Notifikasi Baru)
    // ======================
    const fetchNewNotification = async () => {
        const url = getNotificationEndpoint();

        try {
            setLoading(true);
            
            // Mengambil notifikasi terbaru (asumsi API mengurutkan secara DESC dan limit: 1)
            const res = await axiosInstance.get(url, { params: { limit: 1 } });

            if (res.data.success && res.data.data.length > 0) {
                const latestId = res.data.data[0].id;

                if (!lastNotifId.current) {
                    // Kasus 1: Inisialisasi awal. Simpan ID terbaru, JANGAN bunyikan.
                    lastNotifId.current = latestId;
                } else if (latestId !== lastNotifId.current) {
                    // Kasus 2: ID notifikasi baru terdeteksi.
                    
                    // Gunakan perbandingan (>) untuk mencegah false positive jika API 
                    // mengembalikan data lama karena error atau cache.
                    if (latestId > lastNotifId.current) { 
                        setHasNewNotification(true);
                        playNotificationSound(); 
                        lastNotifId.current = latestId; // Update ID terakhir
                    }
                } 
                // Jika latestId === lastNotifId.current, status hasNewNotification tetap (Badge menyala/mati sesuai klik user).

            } 
            // Jika res.data.data kosong, lastNotifId.current tidak diubah, sehingga tidak ada suara.

        } catch (err) {
            console.error(`Gagal cek notifikasi untuk ${userRole}:`, err);
        } finally {
            setLoading(false);
        }
    };

    // ======================
    // EFFECT & INTERVAL
    // ======================
    useEffect(() => {
        // Panggil saat mount untuk inisialisasi ID terakhir
        fetchNewNotification();
        
        // Cek notifikasi baru tiap 5 detik
        const interval = setInterval(fetchNewNotification, 5000); 
        
        // Cleanup function
        return () => clearInterval(interval);
    }, [userRole]);

    // ======================
    // HANDLE CLICK ICON
    // ======================
    const handleClick = () => {
        // Saat diklik, hilangkan badge notifikasi dan navigasi
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
                // Badge hanya muncul jika hasNewNotification = true
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