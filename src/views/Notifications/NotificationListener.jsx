import React, { useEffect, useRef, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../AuthContex/AuthContext'; 
import { BadgeContext } from 'contexts/BadgeContext';

const API_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL?.replace(/\/$/, "") || ""; 

const NotificationListener = () => {
    const socketRef = useRef(null);
    const [isSubscribed, setIsSubscribed] = useState(false); 
    const { user, token } = useContext(AuthContext);
    const { incrementBadge } = useContext(BadgeContext); 
    const processedNotifications = useRef(new Set());

    useEffect(() => {
        if (!token || !user) return;
        
        if (socketRef.current?.connected) return;

        const socket = io(API_URL, {
            auth: { 
                token: token,
                applicationType: 'pawn-apps' 
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            const payload = { 
                userId: String(user.id || user.sub), 
                applicationType: 'pawn-apps'
            };

            socket.emit('register', payload, (response) => {
                if (response?.success) {
                    toast.success('Notifikasi real-time aktif!');
                }
            });
        });

        socket.on('notification', (data) => handleIncomingNotification(data));
        socket.on('trigger', (data) => handleIncomingNotification(data));

        socket.onAny((eventName, ...args) => {
            if (!['connect', 'disconnect', 'connect_error', 'error', 'ping', 'pong'].includes(eventName)) {
                if (args[0] && typeof args[0] === 'object') {
                    handleIncomingNotification(args[0]);
                }
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.offAny();
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
            }
            socketRef.current = null;
        };
    }, [token, user]);

    const handleIncomingNotification = (rawData) => {
        try {
            const payload = rawData.body || rawData.data || rawData;
            const meta = payload.metadata || {};
            
            const notifType = (
                rawData.type || 
                rawData.notificationType || 
                payload.type || 
                payload.notificationType || 
                meta.type ||
                'GENERAL'
            ).toUpperCase();

            const data = {
                no_gadai: payload.no_gadai || payload.noGadai || meta.noGadai || '-',
                message: payload.message || meta.additional_message || payload.title || 'Update transaksi',
                title: payload.title || 'Notifikasi',
            };

            const notifId = `${notifType}_${data.no_gadai}_${Date.now()}`;
            if (processedNotifications.current.has(notifId)) return;
            
            processedNotifications.current.add(notifId);
            setTimeout(() => processedNotifications.current.delete(notifId), 5000);

            incrementBadge('NOTIF_LIST');
            showNotification(notifType, data, notifId);
        } catch (error) {
            
        }
    };

 const showNotification = (type, data, toastId) => {
        const toastOptions = { position: "top-right", autoClose: 6000, toastId };
        let variant = 'info';
        let eventName = 'REFRESH_GENERAL';

        switch (type) {
            case 'NEW_PAWN':
            case 'TRIGGER':
                variant = 'success';
                eventName = 'REFRESH_GADAI_BARU';
                incrementBadge('NEW_PAWN');
                break;
            case 'UNIT_VALIDATED':
                variant = 'success';
                eventName = 'REFRESH_VALIDASI_UNIT';
                break;
            case 'REPEAT_ORDER':
                variant = 'warning';
                eventName = 'REFRESH_REPEAT_ORDER';
                incrementBadge('REPEAT_ORDER');
                break;
            case 'PAYMENT_SUCCESS':
                variant = 'success';
                eventName = 'REFRESH_GADAI_LUNAS';
                break;
            case 'ITEM_AUCTIONED': 
                variant = 'warning'; 
                eventName = 'REFRESH_AUCTION_LIST';
                incrementBadge('AUCTION_NOTIF');
                break;
            case 'DUE_DATE_REMINDER': 
                variant = 'info'; 
                eventName = 'REFRESH_DUE_DATE_REMINDERS';
                incrementBadge('DUE_DATE_NOTIF');
                break;
            default:
                variant = 'info';
                break;
        }

        const content = (
            <div style={{ cursor: 'pointer' }} onClick={() => data.url && window.open(data.url, '_blank')}>
                <strong>{data.title}</strong>
                <p style={{ fontSize: '12px', margin: '4px 0' }}>{data.message}</p>
                <small style={{ opacity: 0.8 }}>No: {data.no_gadai}</small>
            </div>
        );

        if (variant === 'success') toast.success(content, toastOptions);
        else if (variant === 'warning') toast.warning(content, toastOptions);
        else toast.info(content, toastOptions);

        try {
            new Audio(`/sounds/notif-in.mp3`).play().catch(() => {});
        } catch (e) {}

        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    };

    const handleSubscribe = async () => {
        if (!token || !user) return;
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const registration = await navigator.serviceWorker.register('/sw.js');
            const keyRes = await fetch(`${API_URL}/web-push/vapid-public-key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { publicKey } = await keyRes.json();

            const subscription = await registration.pushManager.subscribe({
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
                    userRole: user.role?.toLowerCase(),
                    applicationType: 'pawn-apps' 
                })
            });
            setIsSubscribed(true);
            toast.success("Notifikasi desktop aktif!");
        } catch (error) {}
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
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                {!isSubscribed && (
                    <button 
                        onClick={handleSubscribe}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        Aktifkan Notifikasi Desktop
                    </button>
                )}
            </div>
        </>
    );
};

export default NotificationListener;