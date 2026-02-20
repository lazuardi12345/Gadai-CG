import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Avatar, CircularProgress,
  Box, Typography, Stack, Grid, Paper
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  VerifiedUser as CheckerIcon,
  Engineering as PetugasIcon,
  Inventory2 as GudangIcon,
  Payments as KasirIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';

// Konfigurasi Style & Urutan Fix
const ROLE_MAPPING = [
  { key: 'admin', label: 'Administrator', grad: 'linear-gradient(135deg, #FF1744 0%, #B71C1C 100%)', icon: <AdminIcon /> },
  { key: 'checker', label: 'Kepala Toko', grad: 'linear-gradient(135deg, #FF9100 0%, #E65100 100%)', icon: <CheckerIcon /> },
  { key: 'petugas', label: 'Petugas Lapangan', grad: 'linear-gradient(135deg, #2979FF 0%, #0D47A1 100%)', icon: <PetugasIcon /> },
  { key: 'gudang', label: 'Staff Gudang', grad: 'linear-gradient(135deg, #AA00FF 0%, #4A148C 100%)', icon: <GudangIcon /> },
  { key: 'kasir', label: 'Kasir', grad: 'linear-gradient(135deg, #00E676 0%, #1B5E20 100%)', icon: <KasirIcon /> }
];

const PegawaiListCard = () => {
  const [loading, setLoading] = useState(true);
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    const fetchTim = async () => {
      try {
        const res = await axiosInstance.get('/daftar-pegawai');
        if (res.data.success) {
          setGroupedData(res.data.data);
        }
      } catch (err) {
        console.error("Gagal tarik data pegawai");
      } finally {
        setLoading(false);
      }
    };
    fetchTim();
  }, []);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" py={10}>
      <CircularProgress thickness={6} size={50} sx={{ color: '#004D40' }} />
    </Box>
  );

  return (
    <Card sx={{ 
      borderRadius: '24px', 
      background: '#F8FAFC', 
      boxShadow: 'none', 
      border: '1px solid #E2E8F0',
      overflow: 'hidden'
    }}>
      {/* Header Kece */}
      <Box sx={{ 
        p: 3, 
        background: '#fff', 
        borderBottom: '1px solid #E2E8F0',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: '#004D40', width: 42, height: 42 }}>
            <GroupIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={900} color="#1E293B">Tim Operasional</Typography>
            <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ letterSpacing: 1 }}>SGI SYSTEM v2.0</Typography>
          </Box>
        </Stack>
      </Box>

      <CardContent sx={{ p: 3, maxHeight: '650px', overflowY: 'auto' }}>
        {ROLE_MAPPING.map((role) => {
          const members = groupedData[role.key] || [];
          if (members.length === 0) return null; // Sembunyikan jika role kosong

          return (
            <Box key={role.key} sx={{ mb: 4 }}>
              {/* Judul Role - Modern Label */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '3px', background: role.grad }} />
                <Typography variant="subtitle2" fontWeight={900} color="#475569" sx={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {role.label}
                </Typography>
                <Typography variant="caption" sx={{ ml: 'auto', fontWeight: 800, color: '#94A3B8', bgcolor: '#F1F5F9', px: 1.5, py: 0.5, borderRadius: '10px' }}>
                  {members.length} Orang
                </Typography>
              </Stack>

              {/* Grid Pegawai */}
              <Grid container spacing={2}>
                {members.map((person) => (
                  <Grid item xs={12} key={person.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: '#fff',
                        border: '1px solid #F1F5F9',
                        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                          borderColor: '#CBD5E1'
                        }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          background: role.grad, 
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                      >
                        {person.nama.charAt(0).toUpperCase()}
                      </Avatar>

                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body1" fontWeight={800} color="#1E293B">
                          {person.nama}
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color="textSecondary">
                          Aktif di Sistem
                        </Typography>
                      </Box>

                      <Box sx={{ ml: 'auto', opacity: 0.3, color: '#1E293B' }}>
                        {role.icon}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PegawaiListCard;