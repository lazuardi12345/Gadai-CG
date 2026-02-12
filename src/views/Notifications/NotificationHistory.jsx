import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
    Box, Typography, List, ListItem, IconButton, Chip, Divider,
    CircularProgress, Stack, Container, Card, CardContent, alpha, Button,
    useTheme, useMediaQuery
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle as CheckCircleIcon,
    DoneAll as DoneAllIcon,
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../../AuthContex/AuthContext'; 
import { BadgeContext } from '../../contexts/BadgeContext'; 

const NOTIF_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL;

const NotificationHistory = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 15; 
    
    const { token } = useContext(AuthContext);
    const { setBadgeCount } = useContext(BadgeContext);

    const unreadCount = useMemo(() => 
        notifications.filter(n => !n.isRead).length, 
    [notifications]);

    const fetchNotifications = useCallback(async (isRefresh = false) => {
        if (!token) return;
        
        const currentPage = isRefresh ? 1 : page;
        setLoading(true);

        try {
            const response = await axios.get(`${NOTIF_SERVICE_URL}/notifications/pawn-apps/me`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                },
                params: { 
                    limit: limit, 
                    page: currentPage, 
                    _t: Date.now() 
                }
            });

            const rawResults = response.data?.payload?.data?.results || [];
            
            const normalized = rawResults.map(n => ({
                id: n.id,
                title: n.title || 'No Title',
                message: n.message || '',
                isRead: Boolean(n.is_read), 
                notificationType: n.title.includes('URGENT') ? 'DUE_DATE_REMINDER' : (n.notification_type || 'GENERAL'),
                createdAt: n.created_at || new Date().toISOString(),
                url: n.url || null,
                metadata: n.detail || {}
            }));

            if (isRefresh) {
                setNotifications(normalized);
                setPage(2);
                setHasMore(normalized.length === limit);
                if (setBadgeCount) {
                    const unread = normalized.filter(n => !n.isRead).length;
                    setBadgeCount('NOTIF_LIST', unread);
                }
            } else {
                setNotifications(prev => [...prev, ...normalized]);
                setPage(prev => prev + 1);
                setHasMore(normalized.length === limit);
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            toast.error('Gagal memuat notifikasi');
        } finally {
            setLoading(false);
        }
    }, [token, page, setBadgeCount]);

    useEffect(() => {
        fetchNotifications(true);
    }, [token]);

    const handleMarkAsRead = async (id) => {
        try {
            await axios.patch(`${NOTIF_SERVICE_URL}/notifications/pawn-apps/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            if (setBadgeCount) setBadgeCount('NOTIF_LIST', Math.max(0, unreadCount - 1));
        } catch (error) {
            toast.error('Gagal menandai sudah dibaca');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch(`${NOTIF_SERVICE_URL}/notifications/pawn-apps/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            if (setBadgeCount) setBadgeCount('NOTIF_LIST', 0);
            toast.success('Semua dibaca');
        } catch (error) {
            toast.error('Gagal memproses baca semua');
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) await handleMarkAsRead(notif.id);
        if (notif.url) {
            notif.url.startsWith('http') ? window.open(notif.url, '_blank') : navigate(notif.url);
        }
    };

    const getIcon = (type) => {
        const map = { REPEAT_ORDER: '🔄', DUE_DATE_REMINDER: '⏰', NEW_PAWN: '📝' };
        return map[type] || '🔔';
    };

    return (
        <Container maxWidth="md" sx={{ py: { xs: 1, md: 3 }, px: { xs: 1, md: 2 } }}>
            <Card elevation={isMobile ? 1 : 3} sx={{ borderRadius: { xs: 1, md: 2 } }}>
                <CardContent sx={{ p: 0 }}>
                    {/* --- HEADER --- */}
                    <Box sx={{ 
                        p: { xs: 1.5, md: 3 }, 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'flex-start' : 'center' 
                    }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconButton onClick={() => navigate(-1)} color="primary" size={isMobile ? "small" : "medium"}>
                                <ArrowBackIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                            <Box>
                                <Typography variant={isMobile ? "subtitle1" : "h5"} fontWeight="bold">
                                    Riwayat Notifikasi
                                </Typography>
                                {unreadCount > 0 && isMobile && (
                                    <Typography variant="caption" color="error" fontWeight="bold">
                                        {unreadCount} Pesan Belum Dibaca
                                    </Typography>
                                )}
                            </Box>
                            {unreadCount > 0 && !isMobile && (
                                <Chip label={`${unreadCount} Baru`} color="error" size="small" />
                            )}
                        </Stack>

                        <Stack direction="row" spacing={1} alignSelf={isMobile ? 'flex-end' : 'center'}>
                            {unreadCount > 0 && (
                                <Button 
                                    size="small" 
                                    variant="outlined" 
                                    startIcon={<DoneAllIcon />} 
                                    onClick={handleMarkAllAsRead}
                                >
                                    Baca Semua
                                </Button>
                            )}
                            <IconButton onClick={() => fetchNotifications(true)} color="primary">
                                <RefreshIcon />
                            </IconButton>
                        </Stack>
                    </Box>
                    <Divider />

                    {/* --- LIST NOTIFIKASI --- */}
                    {notifications.length === 0 && !loading ? (
                        <Box sx={{ textAlign: 'center', py: 10 }}>
                            <NotificationsIcon sx={{ fontSize: 60, color: 'grey.200', mb: 2 }} />
                            <Typography color="text.secondary">Belum ada notifikasi</Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {notifications.map((notif, index) => (
                                <React.Fragment key={notif.id}>
                                    <ListItem
                                        onClick={() => handleNotificationClick(notif)}
                                        sx={{
                                            bgcolor: notif.isRead ? 'transparent' : alpha('#1976d2', 0.04),
                                            cursor: 'pointer', 
                                            py: 2, 
                                            px: { xs: 1.5, md: 3 },
                                            transition: '0.2s',
                                            '&:hover': { bgcolor: alpha('#1976d2', 0.08) }
                                        }}
                                        secondaryAction={!notif.isRead && !isMobile && (
                                            <Tooltip title="Tandai Dibaca">
                                                <IconButton 
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }} 
                                                    color="primary"
                                                >
                                                    <CheckCircleIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            gap: { xs: 1.5, md: 2 }, 
                                            width: '100%', 
                                            pr: (!notif.isRead && !isMobile) ? 5 : 0 
                                        }}>
                                            {/* Status Dot */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 12 }}>
                                                {!notif.isRead && <CircleIcon sx={{ fontSize: 10, color: 'error.main' }} />}
                                            </Box>

                                            {/* Icon Type */}
                                            <Box sx={{ 
                                                fontSize: { xs: 24, md: 32 }, 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                bgcolor: '#f5f5f5',
                                                borderRadius: '50%',
                                                p: 1,
                                                height: 'fit-content'
                                            }}>
                                                {getIcon(notif.notificationType)}
                                            </Box>

                                            {/* Content */}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography 
                                                    variant="body1" 
                                                    fontWeight={notif.isRead ? 500 : 700}
                                                    color={notif.isRead ? 'text.primary' : 'primary.main'}
                                                    sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, mb: 0.5 }}
                                                >
                                                    {notif.title}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary"
                                                    sx={{ 
                                                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                                                        lineHeight: 1.4,
                                                        mb: 1
                                                    }}
                                                >
                                                    {notif.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                                                    {new Date(notif.createdAt).toLocaleString('id-ID', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </ListItem>
                                    {index < notifications.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}

                    {/* --- LOAD MORE --- */}
                    {hasMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, bgcolor: '#fafafa' }}>
                            <Button 
                                variant="outlined" 
                                onClick={() => fetchNotifications(false)}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                sx={{ borderRadius: 20, px: 4 }}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Lihat Lebih Banyak'}
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default NotificationHistory;