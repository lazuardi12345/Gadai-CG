import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Autocomplete, FormControl,
  InputLabel, Select, MenuItem, Typography, Box, Alert, AlertTitle, Divider
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const TambahPerpanjanganTempoPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const userRole = user?.role?.toLowerCase() || ""; 

  const apiBaseUrl = (userRole === "checker" || userRole === "petugas") ? `/${userRole}/perpanjangan-tempo` : "/perpanjangan-tempo";
  const detailGadaiUrl = (userRole === "checker" || userRole === "petugas") ? `/${userRole}/detail-gadai` : "/detail-gadai";

  const [form, setForm] = useState({
    detail_gadai_id: "",
    tanggal_perpanjangan: new Date().toISOString().split("T")[0],
    jatuh_tempo_baru: "",
  });

  const [detailGadai, setDetailGadai] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null); // Simpan detail unit terpilih
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenorPilihan, setTenorPilihan] = useState("");
  const [errorMessage, setErrorMessage] = useState(null); // State khusus error perpanjangan

  useEffect(() => {
    const fetchDetailGadai = async () => {
      try {
        const res = await axiosInstance.get(detailGadaiUrl);
        setDetailGadai(res.data.data || []);
      } catch (err) {
        alert("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    fetchDetailGadai();
  }, [detailGadaiUrl]);

  const handleTenorChange = (e) => {
    const tenor = e.target.value;
    setTenorPilihan(tenor);
    setErrorMessage(null); // Clear error saat ganti tenor
    
    if (form.tanggal_perpanjangan && tenor) {
      const d = new Date(form.tanggal_perpanjangan);
      d.setDate(d.getDate() + parseInt(tenor));
      setForm((prev) => ({ ...prev, jatuh_tempo_baru: d.toISOString().split("T")[0] }));
    }
  };

  const handleSubmit = async () => {
    if (!form.detail_gadai_id || !form.tanggal_perpanjangan || !form.jatuh_tempo_baru) {
      alert("Semua field harus diisi!");
      return;
    }

    setErrorMessage(null);
    try {
      setSaving(true);
      const res = await axiosInstance.post(apiBaseUrl, form);
      if (res.data.success) {
        alert("Perpanjangan berhasil ditambahkan (Status: Pending)");
        navigate('/perpanjangan-tempo');
      }
    } catch (err) {
      // Tangkap pesan error limit 90 hari dari Backend
      const msg = err.response?.data?.message || "Terjadi kesalahan server";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;

  return (
    <Card sx={{ p: 2, borderRadius: 3 }}>
      <CardHeader 
        title={<Typography variant="h6" fontWeight="bold">Tambah Perpanjangan Tempo</Typography>}
        subheader="Ajukan penambahan masa tenor untuk nasabah"
      />
      <Divider sx={{ mb: 2 }} />
      <CardContent>
        
        {/* ALERT KHUSUS LIMIT 90 HARI */}
        {errorMessage && (
          <Alert 
            severity="error" 
            variant="filled" 
            icon={<ErrorOutlineIcon fontSize="inherit" />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <AlertTitle sx={{ fontWeight: '900' }}>PERPANJANGAN DITOLAK</AlertTitle>
            {errorMessage}
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Unit ini sudah mencapai batas maksimal masa simpan (90 hari). 
              Nasabah <b>Wajib melakukan pelunasan</b> atau barang akan diproses lelang sesuai prosedur.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Autocomplete
              options={detailGadai}
              getOptionLabel={(option) => `${option.no_gadai} - ${option.nasabah?.nama_lengkap} (${option.hp?.merk_name || 'Unit'})`}
              onChange={(event, newValue) => {
                setForm((prev) => ({ ...prev, detail_gadai_id: newValue ? newValue.id : "" }));
                setSelectedUnit(newValue);
                setErrorMessage(null);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Cari No Gadai / Nama Nasabah" size="small" fullWidth />
              )}
            />
          </Grid>

          {/* Info Ringkas Unit */}
          {selectedUnit && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px dashed #ccc' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>INFO UNIT SAAT INI:</Typography>
                <Grid container>
                  <Grid item xs={6}><Typography variant="body2">Tgl Gadai: <b>{selectedUnit.tanggal_gadai}</b></Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Jatuh Tempo: <b style={{ color: 'red' }}>{selectedUnit.jatuh_tempo}</b></Typography></Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              label="Tanggal Perpanjangan (Bayar)"
              type="date"
              value={form.tanggal_perpanjangan}
              onChange={(e) => {
                setForm(prev => ({ ...prev, tanggal_perpanjangan: e.target.value, jatuh_tempo_baru: "" }));
                setTenorPilihan("");
                setErrorMessage(null);
              }}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={!form.tanggal_perpanjangan || !!errorMessage}>
              <InputLabel>Pilih Tenor (Hari)</InputLabel>
              <Select
                value={tenorPilihan}
                label="Pilih Tenor (Hari)"
                onChange={handleTenorChange}
              >
                <MenuItem value={15}>15 Hari</MenuItem>
                <MenuItem value={30}>30 Hari</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {form.jatuh_tempo_baru && !errorMessage && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'white', textAlign: 'center' }}>
                <Typography variant="body2">Estimasi Jatuh Tempo Baru:</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {new Date(form.jatuh_tempo_baru).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/perpanjangan-tempo')}>
            Kembali
          </Button>
          <Button 
            variant="contained" 
            color={errorMessage ? "error" : "primary"} 
            onClick={handleSubmit} 
            disabled={saving || !!errorMessage}
            sx={{ fontWeight: 'bold', px: 4 }}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : "Simpan Pengajuan"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TambahPerpanjanganTempoPage;