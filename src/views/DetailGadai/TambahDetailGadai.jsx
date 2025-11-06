import React, { useState, useEffect, useContext } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Grid,
  CircularProgress,
  Autocomplete,
  Box,
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const TambahDetailGadaiPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tanggal_gadai: '',
    jatuh_tempo: '',
    taksiran: '',
    uang_pinjaman: '',
    type_id: '',
    nasabah_id: '',
  });

  const [types, setTypes] = useState([]);
  const [nasabahs, setNasabahs] = useState([]);
  const [selectedNasabah, setSelectedNasabah] = useState(null);

  // 🔹 Tentukan API otomatis berdasarkan role (petugas tidak termasuk)
  const getApiUrl = (resource) => {
    switch (userRole) {
      case 'checker':
        return `/checker/${resource}`;
      case 'hm':
        return `/${resource}`;
      default:
        return null; // petugas tidak boleh
    }
  };

  // 🔹 Ambil data awal
  useEffect(() => {
    const initData = async () => {
      try {
        const [resType, resNasabah] = await Promise.all([
          axiosInstance.get('/type'),
          axiosInstance.get(getApiUrl('data-nasabah')),
        ]);
        setTypes(resType.data?.data || []);
        setNasabahs(resNasabah.data?.data || []);
      } catch (err) {
        console.error(err);
        alert('Gagal mengambil data awal');
      } finally {
        setLoading(false);
      }
    };

    if (getApiUrl('data-nasabah')) {
      initData();
    } else {
      alert('Role tidak diizinkan untuk menambahkan data!');
      navigate('/detail-gadai');
    }
  }, []);

  // 🔹 Input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Submit handler
  const handleSubmit = async () => {
    // Validasi
    const requiredFields = [
      'tanggal_gadai',
      'jatuh_tempo',
      'taksiran',
      'uang_pinjaman',
      'type_id',
      'nasabah_id',
    ];
    for (let key of requiredFields) {
      if (!form[key]) {
        alert('Harap isi semua field!');
        return;
      }
    }

    try {
      setSaving(true);
      const apiUrl = getApiUrl('detail-gadai');
      if (!apiUrl) {
        alert('Role tidak diizinkan untuk menambahkan data!');
        return;
      }

      const res = await axiosInstance.post(apiUrl, form);
      if (res.data?.success) {
        alert('Data berhasil disimpan!');
        navigate('/detail-gadai');
      } else {
        alert(res.data?.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Terjadi kesalahan server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Tambah Detail Gadai" />
      <CardContent>
        <Grid container spacing={3}>
          {/* Kolom kiri */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                label="Tanggal Gadai"
                name="tanggal_gadai"
                type="date"
                value={form.tanggal_gadai}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Jatuh Tempo"
                name="jatuh_tempo"
                type="date"
                value={form.jatuh_tempo}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Type Barang</InputLabel>
                <Select
                  name="type_id"
                  value={form.type_id}
                  onChange={handleInputChange}
                  label="Type Barang"
                >
                  {types.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.nama_type || '-'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          {/* Kolom kanan */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                label="Taksiran"
                name="taksiran"
                type="number"
                value={form.taksiran}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Uang Pinjaman"
                name="uang_pinjaman"
                type="number"
                value={form.uang_pinjaman}
                onChange={handleInputChange}
                fullWidth
              />

              {/* Autocomplete Nasabah */}
              <Autocomplete
                options={nasabahs}
                getOptionLabel={(option) => option?.nama_lengkap || ''}
                value={selectedNasabah}
                onChange={(e, newValue) => {
                  setSelectedNasabah(newValue);
                  setForm((prev) => ({
                    ...prev,
                    nasabah_id: newValue?.id || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cari Nasabah"
                    placeholder="Ketik nama nasabah..."
                    fullWidth
                  />
                )}
              />

              {selectedNasabah && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    bgcolor: '#fafafa',
                  }}
                >
                  <strong>Detail Nasabah:</strong>
                  <div>Nama: {selectedNasabah?.nama_lengkap || '-'}</div>
                  <div>No HP: {selectedNasabah?.no_hp || '-'}</div>
                  <div>Alamat: {selectedNasabah?.alamat || '-'}</div>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Tombol aksi */}
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/detail-gadai')}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TambahDetailGadaiPage;
