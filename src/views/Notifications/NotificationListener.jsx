import React, { useEffect, useRef, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../AuthContex/AuthContext'; 

const RAW_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL;
const API_URL = RAW_URL ? RAW_URL.replace(/\/$/, "") : ""; 
const SOCKET_URL = API_URL;

const NotificationListener = () => {
    const socketRef = useRef(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { user, token } = useContext(AuthContext);
    
    // Mencegah notifikasi ganda (Double Trigger)
    const processedNotifications = useRef(new Set());

    useEffect(() => {
        if (!token) return;
        
        if (socketRef.current?.connected) return;

        // Inisialisasi Socket
        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
        });

        const socket = socketRef.current;

        socket.on('connect', () => console.log('✅ Socket Connected'));

        socket.on('notification', (data) => {
            console.log('🔔 New Notification:', data);

            // Generate ID unik untuk Toast agar tidak overlap
            const notifId = `${data.type}_${data.no_gadai}_${Date.now()}`;

            if (processedNotifications.current.has(notifId)) return;
            processedNotifications.current.add(notifId);
            setTimeout(() => processedNotifications.current.delete(notifId), 5000);

            // Router Notifikasi berdasarkan Type
            switch (data.type) {
                case 'NEW_PAWN':
                    handleNotify('success', 'GADAI BARU', data, 'notif-in.mp3', 'REFRESH_GADAI_BARU', notifId);
                    break;

                case 'REPEAT_ORDER':
                    // Status: PROSES (Repeat Order)
                    handleNotify('warning', '🔥 REPEAT ORDER', data, 'notif-in.mp3', 'REFRESH_REPEAT_ORDER', notifId);
                    break;

                case 'UNIT_VALIDATED':
                    // Status: SELESAI
                    handleNotify('info', 'UNIT SELESAI DIVALIDASI', data, 'notif-in.mp3', 'REFRESH_GADAI_SELESAI', notifId);
                    break;

                case 'PAYMENT_SUCCESS':
                    // Status: LUNAS
                    handleNotify('success', 'PELUNASAN BERHASIL', data, 'notif-success.mp3', 'REFRESH_GADAI_LUNAS', notifId);
                    break;

                default:
                    handleNotify('default', data.title || 'NOTIFIKASI', data, 'notif-in.mp3', 'REFRESH_GENERAL', notifId);
            }
        });

        socket.on('connect_error', (err) => console.error('❌ Socket Error:', err.message));

        return () => {
            if (socket) {
                socket.off('notification');
                socket.disconnect();
            }
            socketRef.current = null;
        };
    }, [token]);

    /**
     * Reusable Logic untuk menampilkan Toast, Suara, dan Event Dispatcher
     */
    const handleNotify = (variant, title, data, soundFile, eventName, toastId) => {
        const toastOptions = {
            position: "top-right",
            autoClose: variant === 'warning' ? 12000 : 6000, // Repeat order tampil lebih lama
            theme: variant === 'default' ? 'light' : 'colored',
            toastId: toastId,
            closeOnClick: true,
            pauseOnHover: true,
        };

        const toastContent = (
            <div style={{ minWidth: '250px' }}>
                <strong style={{ fontSize: '14px', letterSpacing: '0.5px' }}>{title}</strong>
                <p style={{ fontSize: '12px', margin: '5px 0' }}>{data.message}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', opacity: 0.9 }}>
                    <small>No. Gadai: <strong>{data.no_gadai || '-'}</strong></small>
                    {data.nama_nasabah && (
                        <small>Nasabah: <strong>{data.nama_nasabah}</strong></small>
                    )}
                    {data.nominal_masuk && (
                        <small>Uang Masuk: Rp {Number(data.nominal_masuk).toLocaleString('id-ID')}</small>
                    )}
                </div>
            </div>
        );

        // Eksekusi Toast sesuai variant
        if (variant === 'success') toast.success(toastContent, toastOptions);
        else if (variant === 'warning') toast.warning(toastContent, toastOptions);
        else if (variant === 'info') toast.info(toastContent, toastOptions);
        else toast(toastContent, toastOptions);

        // Bunyikan Audio
        playAudio(`/sounds/${soundFile}`);

        // Dispatch Event agar UI lain (Table/Dashboard) auto-refresh
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    };

    const playAudio = (url) => {
        const audio = new Audio(url);
        audio.volume = 0.6;
        audio.play().catch(() => console.warn("🔊 Autoplay blocked by browser policy."));
    };

    /**
     * Web Push Notification (Desktop)
     */
    const handleSubscribe = async () => {
        if (!token || !user) {
            toast.error("Sesi berakhir, silakan login kembali.");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                toast.error('Izin notifikasi ditolak.');
                return;
            }
            
            const keyRes = await fetch(`${API_URL}/web-push/vapid-public-key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { publicKey } = await keyRes.json();

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            const res = await fetch(`${API_URL}/web-push/subscribe`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: subscription.toJSON().keys,
                    userId: user.id,
                    userRole: user.role,
                    applicationType: 'pawn-apps'
                })
            });

            if (res.ok) {
                setIsSubscribed(true);
                toast.success("Notifikasi desktop aktif!");
            }
        } catch (error) {
            console.error("Web Push Error:", error);
        }
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
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            fontSize: '14px'
                        }}
                    >
                        🔔 Aktifkan Notifikasi Desktop
                    </button>
                )}
            </div>
        </>
    );
};

export default NotificationListener;