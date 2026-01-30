import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../AuthContex/AuthContext'; 
import { BadgeContext } from 'contexts/BadgeContext';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';

const API_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL?.replace(/\/$/, "") || ""; 
const SNOOZE_KEY = 'pawn_apps_notif_snooze';

const NotificationListener = () => {
    const socketRef = useRef(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const { user, token } = useContext(AuthContext);
    const { incrementBadge } = useContext(BadgeContext); 
    const processedNotifications = useRef(new Set());

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
                const statusLelang = data.status_lelang; 

                if (statusLelang === 'terlelang') {
                    incrementBadge('AUCTION_NOTIF');
                    eventName = 'REFRESH_AUCTION_TERLELANG';
                    toast.warning(content, { ...options, icon: "🔨" });
                } else if (statusLelang === 'lunas') {
                    eventName = 'REFRESH_AUCTION_LUNAS';
                    toast.success(content, { ...options, icon: "💰" });
                } else {
                    incrementBadge('AUCTION_NOTIF');
                    eventName = 'REFRESH_AUCTION_LIST';
                    toast.error(content, options);
                }
                break;

            case 'REPEAT_ORDER':
                incrementBadge('REPEAT_ORDER');
                eventName = 'REFRESH_REPEAT_ORDER';
                toast.warning(content, options);
                break;

            case 'DUE_DATE_REMINDER':
                incrementBadge('NOTIF_LIST');
                eventName = 'REFRESH_DUE_DATE';
                toast.info(content, options);
                break;

            default:
                toast.info(content, options);
        }

        new Audio(`/sounds/notif-in.mp3`).play().catch(() => {});
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }, [incrementBadge]);

    const handleIncoming = useCallback((rawData) => {
        console.log("📥 Notif Masuk:", rawData);
        
        const payload = rawData.body || rawData.data || rawData;
        const meta = payload.metadata || {};
        
        const type = (rawData.type || payload.notificationType || payload.type || meta.type || 'GENERAL').toUpperCase();
        
        const data = {
            no_gadai: payload.noGadai || meta.noGadai || payload.no_gadai || '-',
            title: payload.title || meta.title || 'Informasi Gadai',
            message: payload.message || meta.additional_message || payload.body || 'Ada pembaruan data.',
            url: payload.url || meta.directUrl || '/',
            status_lelang: payload.status_lelang || meta.status_lelang || 'siap' 
        };

        const notifId = `${type}_${data.no_gadai}_${Date.now()}`;
        if (processedNotifications.current.has(notifId)) return;
        processedNotifications.current.add(notifId);
        setTimeout(() => processedNotifications.current.delete(notifId), 5000);

        showWebPush(data);     
        incrementBadge('NOTIF_LIST'); 
        triggerToast(type, data, notifId); 
    }, [incrementBadge, triggerToast, showWebPush]);

    useEffect(() => {
        if (!token || !user) return;
        if (socketRef.current?.connected) return;

        const socket = io(API_URL, {
            auth: { token, applicationType: 'pawn-apps' },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('register', { userId: String(user.id || user.sub), applicationType: 'pawn-apps' });
        });

        socket.on('notification', handleIncoming);
        socket.on('trigger', handleIncoming);

        socket.onAny((event, ...args) => {
            if (!['connect', 'disconnect', 'error', 'ping'].includes(event) && args[0]) {
                handleIncoming(args[0]);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            socketRef.current = null;
        };
    }, [token, user, handleIncoming]);

    const checkSubscriptionStatus = useCallback(async () => {
        if (!("Notification" in window)) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (Notification.permission === 'default' || !subscription) {
                setShowPrompt(true);
            }
        } catch (e) {}
    }, []);

    useEffect(() => { checkSubscriptionStatus(); }, [checkSubscriptionStatus]);

    const handleSubscribe = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return setShowPrompt(false);
            
            const registration = await navigator.serviceWorker.register('/sw.js');
            const keyRes = await fetch(`${API_URL}/web-push/vapid-public-key`, { headers: { 'Authorization': `Bearer ${token}` } });
            const { publicKey } = await keyRes.json();
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
            
            await fetch(`${API_URL}/web-push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: subscription.toJSON().keys,
                    userId: String(user.id || user.sub),
                    applicationType: 'pawn-apps'
                })
            });
            setShowPrompt(false);
            toast.success("Notifikasi Desktop Aktif!");
        } catch (err) { console.error("WebPush Error:", err); }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    };

    return (
        <>
            <ToastContainer limit={3} newestOnTop />
            {showPrompt && (
                <Paper elevation={10} sx={{ position: 'fixed', bottom: 25, right: 25, zIndex: 9999, p: 2.5, maxWidth: 340, borderRadius: 4, borderLeft: '6px solid #2e7d32' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Aktifkan Notifikasi Desktop? 🔔</Typography>
                    <Typography variant="body2" sx={{ my: 1, color: 'text.secondary' }}>Agar update alur lelang (Siap, Terlelang, Lunas) tetap terpantau.</Typography>
                    <Stack direction="row" spacing={1.5} mt={1.5}>
                        <Button fullWidth variant="contained" color="success" size="small" onClick={handleSubscribe} sx={{ borderRadius: 2 }}>Aktifkan</Button>
                        <Button fullWidth variant="outlined" color="inherit" size="small" onClick={() => setShowPrompt(false)} sx={{ borderRadius: 2 }}>Nanti</Button>
                    </Stack>
                </Paper>
            )}
        </>
    );
};

export default NotificationListener;