import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Autocomplete, FormControl,
  InputLabel, Select, MenuItem, Typography, Box, Alert, AlertTitle, Divider
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import debounce from "lodash/debounce";

const TambahPerpanjanganTempoPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const userRole = user?.role?.toLowerCase() || ""; 

  // Endpoint diarahkan ke index perpanjangan tapi nanti di Laravel masuk ke mode search Master Gadai
  const apiBaseUrl = (userRole === "checker" || userRole === "petugas") 
    ? `/${userRole}/perpanjangan-tempo` 
    : "/perpanjangan-tempo";

  const [form, setForm] = useState({
    detail_gadai_id: "",
    tanggal_perpanjangan: new Date().toISOString().split("T")[0],
    jatuh_tempo_baru: "",
  });

  const [options, setOptions] = useState([]); 
  const [inputValue, setInputValue] = useState(""); 
  const [selectedUnit, setSelectedUnit] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tenorPilihan, setTenorPilihan] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  // --- SEARCH LOGIC (Mencari Nasabah yang Statusnya BELUM Lunas) ---
  const fetchNasabah = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        // mode=search ini penting biar Laravel manggil fungsi private searchSemuaNasabah
        const res = await axiosInstance.get(`${apiBaseUrl}?search=${query}&mode=search`);
        setOptions(res.data.data || []);
      } catch (err) {
        console.error("Gagal cari nasabah:", err);
      } finally {
        setLoading(false);
      }
    }, 500),
    [apiBaseUrl]
  );

  useEffect(() => {
    fetchNasabah(inputValue);
    return () => fetchNasabah.cancel();
  }, [inputValue, fetchNasabah]);

  const handleTenorChange = (e) => {
    const tenor = e.target.value;
    setTenorPilihan(tenor);
    
    if (form.tanggal_perpanjangan && tenor) {
      const d = new Date(form.tanggal_perpanjangan);
      d.setDate(d.getDate() + parseInt(tenor));
      setForm((prev) => ({ ...prev, jatuh_tempo_baru: d.toISOString().split("T")[0] }));
    }
  };

  const handleSubmit = async () => {
    if (!form.detail_gadai_id || !tenorPilihan) {
      alert("Pilih nasabah dan tenor terlebih dahulu!");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await axiosInstance.post(apiBaseUrl, form);
      if (res.data.success) {
        alert("Selesai diinput! Status: Pending (Silakan lanjut ke Pembayaran)");
        navigate('/perpanjangan-tempo');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: 2, borderRadius: 3 }}>
      <CardHeader 
        title={<Typography variant="h6" fontWeight="bold">Input Perpanjangan Tempo</Typography>}
        subheader="Cari nasabah aktif (Status: Selesai / Belum Lunas)"
      />
      <Divider sx={{ mb: 2 }} />
      <CardContent>
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Autocomplete
              filterOptions={(x) => x} // Bypass filter client-side
              options={options}
              loading={loading}
              // Mencegah 'undefined' dengan fallback string kosong atau 'Tanpa Nama'
              getOptionLabel={(option) => {
                if (!option) return "";
                const no = option.no_gadai || "???";
                const nama = option.nasabah?.nama_lengkap || "Nama tidak ditemukan";
                return `${no} - ${nama}`;
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              onChange={(event, newValue) => {
                setSelectedUnit(newValue);
                setForm(prev => ({ ...prev, detail_gadai_id: newValue ? newValue.id : "" }));
                setTenorPilihan("");
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {option.no_gadai}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Nasabah: {option.nasabah?.nama_lengkap || 'N/A'} | 
                      Barang: {option.hp?.merk_name || option.type?.nama_type || 'Unit'}
                    </Typography>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Cari No Gadai atau Nama Nasabah..." 
                  size="small" 
                  fullWidth 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {selectedUnit && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #dee2e6' }}>
                <Typography variant="caption" fontWeight="bold" color="primary">INFO UNIT AKTIF:</Typography>
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Nama: <b>{selectedUnit.nasabah?.nama_lengkap}</b></Typography>
                    <Typography variant="body2">Jatuh Tempo: <b style={{color: 'red'}}>{selectedUnit.jatuh_tempo}</b></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Pinjaman: <b>Rp {new Intl.NumberFormat('id-ID').format(selectedUnit.uang_pinjaman)}</b></Typography>
                    <Typography variant="body2">Status Barang: <b>{selectedUnit.status?.toUpperCase()}</b></Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              label="Tanggal Bayar Perpanjangan"
              type="date"
              value={form.tanggal_perpanjangan}
              onChange={(e) => setForm(prev => ({ ...prev, tanggal_perpanjangan: e.target.value }))}
              fullWidth size="small" InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={!selectedUnit}>
              <InputLabel>Tenor (Hari)</InputLabel>
              <Select value={tenorPilihan} label="Tenor (Hari)" onChange={handleTenorChange}>
                <MenuItem value={15}>15 Hari</MenuItem>
                <MenuItem value={30}>30 Hari</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {form.jatuh_tempo_baru && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, textAlign: 'center', border: '1px solid #4caf50' }}>
                <Typography variant="body2">Estimasi Jatuh Tempo Baru:</Typography>
                <Typography variant="h6" color="green" fontWeight="bold">
                  {new Date(form.jatuh_tempo_baru).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/perpanjangan-tempo')}>Batal</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={saving || !form.detail_gadai_id}
            sx={{ px: 4, fontWeight: 'bold' }}
          >
            {saving ? <CircularProgress size={24} /> : "Simpan Pengajuan"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TambahPerpanjanganTempoPage;