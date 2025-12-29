import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const TambahPerpanjanganTempoPage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("auth_user"));
  const userRole = user?.role?.toLowerCase() || ""; 

  const apiBaseUrl = userRole === "checker" ? "/checker/perpanjangan-tempo" : userRole === "petugas" ? "/petugas/perpanjangan-tempo" : "/perpanjangan-tempo";
  const detailGadaiUrl = userRole === "checker" ? "/checker/detail-gadai" : userRole === "petugas" ? "/petugas/detail-gadai" : "/detail-gadai";

  const [form, setForm] = useState({
    detail_gadai_id: "",
    tanggal_perpanjangan: new Date().toISOString().split("T")[0], // Default hari ini
    jatuh_tempo_baru: "",
  });

  const [detailGadai, setDetailGadai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenorPilihan, setTenorPilihan] = useState(""); // State untuk simpan 15 atau 30

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
    
    // Hitung Jatuh Tempo Baru berdasarkan Tanggal Perpanjangan + Tenor
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

    try {
      setSaving(true);
      const res = await axiosInstance.post(apiBaseUrl, form);
      if (res.data.success) {
        alert("Perpanjangan berhasil ditambahkan (Status: Pending)");
        navigate('/perpanjangan-tempo');
      }
    } catch (err) {
      alert(err.response?.data?.message || "Terjadi kesalahan server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;

  return (
    <Card sx={{ p: 2, borderRadius: 3 }}>
      <CardHeader title={<Typography variant="h6" fontWeight="bold">Tambah Perpanjangan Tempo</Typography>} />
      <CardContent>
        <Grid container spacing={3}>
          {/* Pilih No Gadai / Nasabah */}
          <Grid item xs={12}>
            <Autocomplete
              options={detailGadai}
              getOptionLabel={(option) => `${option.no_gadai} - ${option.nasabah?.nama_lengkap}`}
              onChange={(event, newValue) => {
                setForm((prev) => ({ ...prev, detail_gadai_id: newValue ? newValue.id : "" }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Cari No Gadai / Nama Nasabah" size="small" fullWidth />
              )}
            />
          </Grid>

          {/* Tanggal Perpanjangan (Kapan nasabah bayar perpanjangan) */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tanggal Perpanjangan"
              type="date"
              value={form.tanggal_perpanjangan}
              onChange={(e) => {
                setForm(prev => ({ ...prev, tanggal_perpanjangan: e.target.value, jatuh_tempo_baru: "" }));
                setTenorPilihan(""); // Reset tenor jika tanggal berubah
              }}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Pilih Tenor Perpanjangan */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={!form.tanggal_perpanjangan}>
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

          {/* Preview Jatuh Tempo Baru */}
          {form.jatuh_tempo_baru && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
                <Typography variant="body2">Jatuh Tempo Baru Anda adalah:</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {new Date(form.jatuh_tempo_baru).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/perpanjangan-tempo')}>Batal</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Pengajuan"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TambahPerpanjanganTempoPage;