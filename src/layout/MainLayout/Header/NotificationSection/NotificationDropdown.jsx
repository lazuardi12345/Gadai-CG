import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
    Box,
    IconButton,
    Badge,
    Popover,
    Typography,
    List,
    ListItem,
    Divider,
    Button,
    Chip,
    CircularProgress,
    Stack,
    alpha
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle as CheckCircleIcon,
    DoneAll as DoneAllIcon,
    Refresh as RefreshIcon,
    History as HistoryIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';
import { BadgeContext } from 'contexts/BadgeContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL;

const NotificationDropdown = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const { token } = useContext(AuthContext);
    const { badgeCounts, setBadgeCount } = useContext(BadgeContext);
    const navigate = useNavigate();

    const lastNotifId = useRef(null);
    const hasPlayedSound = useRef(false);
    const notifSound = useRef(new Audio('/asset/sounds/notif.mp3'));

    const open = Boolean(anchorEl);

    const playNotificationSound = () => {
        try {
            const audio = notifSound.current;
            audio.currentTime = 0;
            audio.volume = 0.7;
            audio.play().catch(() => console.warn('Autoplay blocked'));
        } catch (err) {
            console.error('Failed to play sound:', err);
        }
    };

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        
        try {
            const response = await axios.get(`${API_BASE}/api/notifications/history`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 10, page: 1 }
            });

            if (response.data.success) {
                const data = response.data.data.data || [];
                setNotifications(data);
                
                const unread = data.filter(n => !n.isRead).length;
                setUnreadCount(unread);
                
                // Update badge context
                if (setBadgeCount) {
                    setBadgeCount('NOTIF_LIST', unread);
                }

                // Play sound for new notifications
                if (unread > 0 && data.length > 0) {
                    const latestId = data[0].id;
                    if (!lastNotifId.current || latestId !== lastNotifId.current) {
                        if (!hasPlayedSound.current) {
                            playNotificationSound();
                            hasPlayedSound.current = true;
                        }
                        lastNotifId.current = latestId;
                    }
                }
            }
        } catch (err) {
            console.error('❌ Failed to fetch notifications:', err);
        }
    }, [token, setBadgeCount]);

    // Initial fetch & polling
    useEffect(() => {
        if (!token) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [token, fetchNotifications]);

    // Listen to real-time updates
    useEffect(() => {
        const handleRefresh = () => fetchNotifications();
        window.addEventListener('REFRESH_GENERAL', handleRefresh);
        window.addEventListener('NEW_NOTIFICATION', handleRefresh);
        return () => {
            window.removeEventListener('REFRESH_GENERAL', handleRefresh);
            window.removeEventListener('NEW_NOTIFICATION', handleRefresh);
        };
    }, [fetchNotifications]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        if (!open) {
            setLoading(true);
            fetchNotifications().finally(() => setLoading(false));
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (notificationId, event) => {
        event.stopPropagation();
        try {
            await axios.patch(
                `${API_BASE}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            
            const newUnreadCount = Math.max(0, unreadCount - 1);
            setUnreadCount(newUnreadCount);
            if (setBadgeCount) setBadgeCount('NOTIF_LIST', newUnreadCount);
            
        } catch (error) {
            console.error('Failed to mark as read:', error);
            toast.error('Gagal menandai sebagai dibaca');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch(
                `${API_BASE}/api/notifications/read-all`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            if (setBadgeCount) setBadgeCount('NOTIF_LIST', 0);
            
            toast.success('Semua notifikasi ditandai sudah dibaca');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Gagal menandai semua sebagai dibaca');
        }
    };

    const handleNotificationClick = async (notif) => {
        // Mark as read
        if (!notif.isRead) {
            await handleMarkAsRead(notif.id, { stopPropagation: () => {} });
        }

        // Close popover
        handleClose();

        // Navigate
        if (notif.url) {
            if (notif.url.startsWith('http')) {
                window.open(notif.url, '_blank');
            } else {
                navigate(notif.url);
            }
        }
    };

    const handleViewAll = () => {
        handleClose();
        navigate('/histori-notifikasi');
    };

    const getNotificationIcon = (type) => {
        const icons = {
            'NEW_PAWN': '📝',
            'APPROVAL_TO_HM': '📩',
            'APPROVAL_FROM_HM': '✅',
            'UNIT_VALIDATED': '✅',
            'PAYMENT_SUCCESS': '💰',
            'ITEM_AUCTIONED': '🔨',
            'REPEAT_ORDER': '🔄',
            'DUE_DATE_REMINDER': '⏰'
        };
        return icons[type] || '🔔';
    };

    const displayCount = badgeCounts?.NOTIF_LIST || unreadCount;

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge
                    badgeContent={displayCount}
                    color="error"
                    max={99}
                    overlap="circular"
                >
                    <NotificationsIcon sx={{ fontSize: '1.5rem' }} />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 600,
                        mt: 1.5,
                        boxShadow: (theme) => theme.shadows[8],
                    }
                }}
            >
                {/* Header */}
                <Box sx={{ 
                    p: 2, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05)
                }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Notifikasi
                            </Typography>
                            {unreadCount > 0 && (
                                <Chip 
                                    label={`${unreadCount} baru`} 
                                    color="error" 
                                    size="small"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                            {unreadCount > 0 && (
                                <IconButton 
                                    size="small" 
                                    onClick={handleMarkAllAsRead}
                                    title="Tandai semua sudah dibaca"
                                >
                                    <DoneAllIcon fontSize="small" />
                                </IconButton>
                            )}
                            <IconButton size="small" onClick={() => {
                                setLoading(true);
                                fetchNotifications().finally(() => setLoading(false));
                            }}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Box>

                {/* Content */}
                <Box sx={{ maxHeight: 450, overflow: 'auto' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 5 }}>
                            <NotificationsIcon sx={{ fontSize: 60, color: 'grey.400', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                Belum ada notifikasi
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ py: 0 }}>
                            {notifications.map((notif) => (
                                <React.Fragment key={notif.id}>
                                    <ListItem
                                        sx={{
                                            bgcolor: notif.isRead ? 'transparent' : alpha('#1976d2', 0.05),
                                            cursor: 'pointer',
                                            '&:hover': { 
                                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) 
                                            },
                                            py: 1.5,
                                            px: 2,
                                            position: 'relative'
                                        }}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        {!notif.isRead && (
                                            <CircleIcon 
                                                sx={{ 
                                                    fontSize: 10, 
                                                    color: 'error.main',
                                                    position: 'absolute',
                                                    left: 8,
                                                    top: 20
                                                }} 
                                            />
                                        )}
                                        
                                        <Box sx={{ display: 'flex', gap: 1.5, width: '100%', pl: !notif.isRead ? 1.5 : 0 }}>
                                            <Box sx={{ fontSize: 28, minWidth: 35 }}>
                                                {getNotificationIcon(notif.notificationType)}
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography 
                                                    variant="subtitle2" 
                                                    fontWeight={notif.isRead ? 'normal' : 'bold'}
                                                    sx={{ 
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: 'vertical',
                                                    }}
                                                >
                                                    {notif.title}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary"
                                                    sx={{ 
                                                        fontSize: '0.8rem',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        mb: 0.5
                                                    }}
                                                >
                                                    {notif.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">
                                                    {new Date(notif.createdAt).toLocaleString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Typography>
                                            </Box>
                                            
                                            {!notif.isRead && (
                                                <IconButton 
                                                    size="small"
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    sx={{ alignSelf: 'flex-start' }}
                                                >
                                                    <CheckCircleIcon fontSize="small" color="primary" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{ 
                    p: 1.5, 
                    borderTop: 1, 
                    borderColor: 'divider',
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.05)
                }}>
                    <Button 
                        fullWidth 
                        variant="text" 
                        onClick={handleViewAll}
                        startIcon={<HistoryIcon />}
                    >
                        Lihat Semua Riwayat
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default NotificationDropdown;