import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../AuthContex/AuthContext'; 
import { BadgeContext } from 'contexts/BadgeContext';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL?.replace(/\/$/, "") || ""; 
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") || "http://localhost:8000";

const NotificationListener = () => {
    const socketRef = useRef(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const { user, token } = useContext(AuthContext);
    const { incrementBadge, setBadgeCount } = useContext(BadgeContext); 
    const processedNotifications = useRef(new Set());

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const showWebPush = useCallback((data) => {
        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(data.title, {
                    body: data.message,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    vibrate: [200, 100, 200],
                    data: { url: data.url },
                    tag: data.no_gadai 
                });
            });
        }
    }, []);

    const triggerToast = useCallback((type, data, toastId) => {
        const options = { position: "top-right", autoClose: 6000, toastId };
        let eventName = 'REFRESH_GENERAL';

        const content = (
            <div style={{ cursor: 'pointer' }} onClick={() => data.url && window.open(data.url, '_blank')}>
                <strong>{data.title}</strong>
                <p style={{ fontSize: '12px', margin: '4px 0' }}>{data.message}</p>
                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <small style={{ opacity: 0.8, fontWeight: 'bold' }}>No: {data.no_gadai}</small>
                </Box>
            </div>
        );

        switch (type) {
            case 'NEW_PAWN':
                incrementBadge('NEW_PAWN');
                eventName = 'REFRESH_GADAI_BARU';
                toast.success(content, options);
                break;

            case 'APPROVAL_TO_HM':
                incrementBadge('APPROVAL_HM');
                eventName = 'REFRESH_APPROVAL_LIST';
                toast.info(content, { ...options, icon: "📩" });
                break;

            case 'APPROVAL_FROM_HM':
                eventName = 'REFRESH_GADAI_DETAIL'; 
                const isRejected = data.status_transaksi === 'rejected';
                isRejected ? toast.error(content, options) : toast.success(content, options);
                break;

            case 'UNIT_VALIDATED':
                incrementBadge('APPROVAL_HM');
                eventName = 'REFRESH_VALIDASI_UNIT';
                toast.success(content, { ...options, icon: "✅" });
                break;

            case 'PAYMENT_SUCCESS':
                eventName = 'REFRESH_GADAI_LUNAS';
                toast.success(content, { ...options, theme: "colored" });
                break;

            case 'ITEM_AUCTIONED':
                incrementBadge('AUCTION_NOTIF');
                if (data.status_lelang === 'terlelang') {
                    eventName = 'REFRESH_AUCTION_TERLELANG';
                    toast.warning(content, { ...options, icon: "🔨" });
                } else if (data.status_lelang === 'lunas') {
                    eventName = 'REFRESH_AUCTION_LUNAS';
                    toast.success(content, { ...options, icon: "💰" });
                } else {
                    eventName = 'REFRESH_AUCTION_LIST';
                    toast.error(content, options);
                }
                break;

            default:
                toast.info(content, options);
                break;
        }

        new Audio(`/sounds/notif-in.mp3`).play().catch(() => {});
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
        window.dispatchEvent(new CustomEvent('NEW_NOTIFICATION', { detail: data }));
    }, [incrementBadge]);

    const handleIncoming = useCallback((rawData) => {
        const payload = rawData.body || rawData.data || rawData;
        const meta = payload.metadata || {};
        
        const type = (rawData.type || payload.notificationType || payload.type || meta.type || 'GENERAL').toUpperCase();
        
        const data = {
            no_gadai: payload.noGadai || meta.noGadai || payload.no_gadai || '-',
            title: payload.title || meta.title || 'Informasi Gadai',
            message: payload.message || meta.additional_message || payload.body || 'Ada pembaruan data.',
            url: payload.url || meta.directUrl || payload.directUrl || '/',
            status_lelang: payload.status_lelang || meta.status_lelang || 'siap',
            status_transaksi: payload.status_transaksi || meta.status_transaksi || ''
        };

        const notifId = `${type}_${data.no_gadai}_${Date.now()}`;
        if (processedNotifications.current.has(notifId)) return;
        processedNotifications.current.add(notifId);
        setTimeout(() => processedNotifications.current.delete(notifId), 5000);

        showWebPush(data);     
        triggerToast(type, data, notifId); 
    }, [triggerToast, showWebPush]);

    useEffect(() => {
        if (!token || !user) return;
        if (socketRef.current?.connected) return;

        const socket = io(API_URL, {
            auth: { token, applicationType: 'pawn-apps' },
            transports: ['polling', 'websocket'],
        });

        socketRef.current = socket;
        socket.on('connect', () => {
            console.log('✅ Socket connected');
            socket.emit('register', { userId: String(user.id || user.sub), applicationType: 'pawn-apps' });
        });
        socket.on('notification', handleIncoming);
        socket.onAny((event, ...args) => {
            if (!['connect', 'disconnect', 'error', 'ping'].includes(event) && args[0]) handleIncoming(args[0]);
        });

        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [token, user, handleIncoming]);

    const checkSubscriptionStatus = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        const permission = Notification.permission;

        if (permission === 'default') {
            setShowPrompt(true);
        } else if (permission === 'granted') {
            const sw = await navigator.serviceWorker.ready;
            const subscription = await sw.pushManager.getSubscription();
            if (!subscription) {
                setShowPrompt(true);
            }
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => checkSubscriptionStatus(), 1500);
        return () => clearTimeout(timer);
    }, [checkSubscriptionStatus]);

    const handleSubscribe = async () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (isIOS && !isStandalone) {
            toast.warning(
                "Wajib: Klik 'Share' lalu 'Add to Home Screen' dulu biar notif aktif di iPhone!", 
                { position: "top-center", autoClose: 8000 }
            );
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error("Izin ditolak sistem!");
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            const readyRegistration = await navigator.serviceWorker.ready;

            const keyRes = await fetch(`${API_URL}/web-push/vapid-public-key`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const { publicKey } = await keyRes.json();

            const subscription = await readyRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            await fetch(`${API_URL}/web-push/subscribe`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: subscription.toJSON().keys,
                    userId: String(user.id || user.sub),
                    applicationType: 'pawn-apps'
                })
            });

            setShowPrompt(false);
            toast.success("Notifikasi Aktif! 🚀");
        } catch (err) { 
            console.error("Gagal total:", err);
            toast.error("Gagal: " + err.message);
        }
    };

    return (
        <>
            <ToastContainer limit={3} newestOnTop />
            {showPrompt && (
                <Paper 
                    elevation={10} 
                    sx={{ 
                        position: 'fixed', 
                        bottom: { xs: 10, md: 25 }, 
                        left: { xs: 10, md: 'auto' }, 
                        right: { xs: 10, md: 25 }, 
                        zIndex: 9999, 
                        p: 2.5, 
                        maxWidth: { xs: 'none', md: 340 }, 
                        borderRadius: 4, 
                        borderLeft: '6px solid #2e7d32'
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="bold">Aktifkan Notifikasi? 🔔</Typography>
                    <Typography variant="body2" sx={{ my: 1, color: 'text.secondary' }}>
                        Terima update Approval, Lunas, dan Lelang langsung di HP/Desktop kamu.
                    </Typography>
                    <Stack direction="row" spacing={1.5} mt={1.5}>
                        <Button fullWidth variant="contained" color="success" size="small" onClick={handleSubscribe}>
                            Aktifkan
                        </Button>
                        <Button fullWidth variant="outlined" color="inherit" size="small" onClick={() => setShowPrompt(false)}>
                            Nanti
                        </Button>
                    </Stack>
                </Paper>
            )}
        </>
    );
};

export default NotificationListener;