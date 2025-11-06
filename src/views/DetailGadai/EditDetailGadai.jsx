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
  Chip,
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const EditDetailGadaiPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
    status: 'proses',
  });

  const [types, setTypes] = useState([]);
  const [nasabahs, setNasabahs] = useState([]);
  const [selectedNasabah, setSelectedNasabah] = useState(null);

  // 🔹 Tentukan API otomatis berdasarkan role
const getApiUrl = (resource) => {
  switch (userRole) {
    case 'checker':
      return `/checker/${resource}`;
    case 'hm':
      return `/${resource}`;
    default:
      return null; // role lain tidak boleh
  }
};
  // 🔹 Ambil data awal
useEffect(() => {
  if (!['checker', 'hm'].includes(userRole)) {
    alert('Role tidak diizinkan mengedit data!');
    navigate('/detail-gadai');
    return;
  }

  const fetchData = async () => {
    try {
      const detailUrl = `${getApiUrl('detail-gadai')}/${id}`;
      const typeUrl = getApiUrl('type'); // type endpoint sesuai role
      const nasabahUrl = getApiUrl('data-nasabah'); // nasabah endpoint sesuai role

      const [resDetail, resType, resNasabah] = await Promise.all([
        axiosInstance.get(detailUrl),
        axiosInstance.get(typeUrl),
        axiosInstance.get(nasabahUrl),
      ]);

      const detail = resDetail.data.data;
      setForm({
        tanggal_gadai: detail.tanggal_gadai || '',
        jatuh_tempo: detail.jatuh_tempo || '',
        taksiran: detail.taksiran || '',
        uang_pinjaman: detail.uang_pinjaman || '',
        type_id: detail.type_id || '',
        nasabah_id: detail.nasabah_id || '',
        status: detail.status || 'proses',
      });

      setTypes(resType.data.data || []);
      setNasabahs(resNasabah.data.data || []);

      const nasabahFound = resNasabah.data.data.find(
        (n) => n.id === detail.nasabah_id
      );
      setSelectedNasabah(nasabahFound || null);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data detail gadai.');
      navigate('/detail-gadai');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id, userRole]);

  // 🔹 Input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Fungsi warna status
  const getStatusColor = (status) => {
    switch (status) {
      case 'proses':
        return 'warning';
      case 'selesai':
        return 'info';
      case 'lunas':
        return 'success';
      default:
        return 'default';
    }
  };

  // 🔹 Submit handler
const handleSubmit = async () => {
  for (let key of [
    'tanggal_gadai',
    'jatuh_tempo',
    'taksiran',
    'uang_pinjaman',
    'type_id',
    'nasabah_id',
    'status',
  ]) {
    if (!form[key]) {
      alert('Harap isi semua field!');
      return;
    }
  }

  try {
    setSaving(true);
    const apiUrl = `${getApiUrl('detail-gadai')}/${id}`;
    if (!apiUrl) {
      alert('Role tidak diizinkan mengedit data!');
      return;
    }

    const res = await axiosInstance.put(apiUrl, form);
    if (res.data.success) {
      alert('Data berhasil diperbarui!');
      navigate('/detail-gadai');
    } else {
      alert(res.data.message || 'Gagal memperbarui data');
    }
  } catch (err) {
    console.error(err);
    alert(err.message || 'Terjadi kesalahan server');
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
      <CardHeader title="Edit Detail Gadai" />
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
                      {type.nama_type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status dropdown */}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value="proses">Proses</MenuItem>
                  <MenuItem value="selesai">Selesai</MenuItem>
                  <MenuItem value="lunas">Lunas</MenuItem>
                </Select>
              </FormControl>

              {/* Preview warna status */}
              <Chip
                label={form.status.toUpperCase()}
                color={getStatusColor(form.status)}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              />
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
                getOptionLabel={(option) => option.nama_lengkap || ''}
                value={selectedNasabah}
                onChange={(e, newValue) => {
                  setSelectedNasabah(newValue);
                  setForm((prev) => ({
                    ...prev,
                    nasabah_id: newValue ? newValue.id : '',
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
                  <div>Nama: {selectedNasabah.nama_lengkap}</div>
                  <div>No HP: {selectedNasabah.no_hp}</div>
                  <div>Alamat: {selectedNasabah.alamat}</div>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Tombol aksi */}
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/detail-gadai')}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Update'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EditDetailGadaiPage;
