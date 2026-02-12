import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  MenuItem, // Tambahkan ini
} from '@mui/material';
import PhotoIcon from '@mui/icons-material/Photo';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from 'AuthContex/AuthContext';

// List Bank sesuai dengan Enum di Backend
const BANK_LIST = [
  'BCA', 'BRI', 'BNI', 'MANDIRI', 'BTN', 'SEABANK', 'BANK_JAGO', 'NEO_COMMERCE', 
  'ALOO_BANK', 'BLU', 'LINE_BANK', 'DIGIBANK', 'TMRW', 'BANK_RAYA', 'HIBANK',
  'CIMB_NIAGA', 'PERMATA', 'DANAMON', 'PANIN', 'OCBC_NISP', 'MAYBANK', 
  'COMMONWEALTH', 'DBS', 'UOB', 'HSBC', 'STANDARD_CHARTERED', 'ARTHA_GRAHA', 
  'MEGA', 'BUKOPIN', 'BTPN', 'SINARMAS', 'MESTIKA', 'BSI', 'MUAMALAT', 
  'BCA_SYARIAH', 'MEGA_SYARIAH', 'PANIN_SYARIAH', 'BUKOPIN_SYARIAH', 
  'BTPN_SYARIAH', 'VICTORIA_SYARIAH', 'BANK_DKI', 'BANK_JABAR', 'BANK_JATENG', 
  'BANK_JATIM', 'BANK_DIY', 'BANK_JAMBI', 'BANK_SUMUT', 'BANK_RIAU_KEPRI', 
  'BANK_SUMSEL_BABEL', 'BANK_LAMPUNG', 'BANK_KALBAR', 'BANK_KALSEL', 
  'BANK_KALTIMTARA', 'BANK_KALTENG', 'BANK_SULSELBAR', 'BANK_SULUTGO', 
  'BANK_NTB', 'BANK_NTT', 'BANK_BALI', 'BANK_PAPUA', 'BANK_BENGKULU', 'BANK_SULTRA', 'ALADIN_SYARIAH',
];

const EditNasabahPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = (user?.role || '').toLowerCase();

  const [nasabah, setNasabah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const getApiUrl = (resource) => {
    switch (role) {
      case 'checker': return `/checker/${resource}`;
      case 'hm': return `/${resource}`;
      default: return null;
    }
  };

  useEffect(() => {
    if (!['checker', 'hm'].includes(role)) {
      alert('Role tidak diizinkan mengedit data!');
      navigate('/');
      return;
    }

    const fetchNasabah = async () => {
      try {
        const apiUrl = `${getApiUrl('data-nasabah')}/${id}`;
        if (!apiUrl) return;

        const response = await axiosInstance.get(apiUrl);
        if (response.data.success) {
          const data = response.data.data;
          setNasabah({
            ...data,
            bank: data.bank || 'BCA', // Default value jika bank kosong
            foto_ktp_file: null,
            foto_ktp_preview: data.foto_ktp || null,
          });
        } else {
          setError('Data nasabah tidak ditemukan.');
        }
      } catch (err) {
        setError('Gagal mengambil data nasabah.');
      } finally {
        setLoading(false);
      }
    };

    fetchNasabah();
  }, [id, role, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNasabah((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNasabah((prev) => ({
        ...prev,
        foto_ktp_file: file,
        foto_ktp_preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    if (!nasabah.nama_lengkap || !nasabah.nik) {
      alert('Nama dan NIK wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      const apiUrl = `${getApiUrl('data-nasabah')}/${id}`;
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('nama_lengkap', nasabah.nama_lengkap);
      formData.append('nik', nasabah.nik);
      formData.append('alamat', nasabah.alamat || '');
      formData.append('no_hp', nasabah.no_hp || '');
      formData.append('bank', nasabah.bank); // Tambahkan Bank
      formData.append('no_rek', nasabah.no_rek || '');
      
      if (nasabah.foto_ktp_file instanceof File) {
        formData.append('foto_ktp', nasabah.foto_ktp_file);
      }

      const response = await axiosInstance.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        alert('Data berhasil diperbarui!');
        navigate(role === 'checker' ? '/checker/data-nasabah' : '/data-nasabah');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Grid container justifyContent="center" alignItems="center" style={{ height: '80vh' }}><CircularProgress /></Grid>;

  return (
    <Grid container justifyContent="center" style={{ marginTop: 20 }}>
      <Grid item xs={12} md={8} lg={6}>
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardHeader title="Edit Data Nasabah" />
          <CardContent>
            <Stack spacing={3}>
              <TextField label="Nama Lengkap" name="nama_lengkap" value={nasabah.nama_lengkap} onChange={handleChange} fullWidth />
              <TextField label="NIK" name="nik" value={nasabah.nik} onChange={handleChange} fullWidth />
              <TextField label="Alamat" name="alamat" value={nasabah.alamat} onChange={handleChange} fullWidth multiline rows={3} />
              <TextField label="No HP" name="no_hp" value={nasabah.no_hp} onChange={handleChange} fullWidth />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Pilih Bank"
                    name="bank"
                    value={nasabah.bank}
                    onChange={handleChange}
                    fullWidth
                  >
                    {BANK_LIST.map((b) => (
                      <MenuItem key={b} value={b}>
                        {b.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nomor Rekening"
                    name="no_rek"
                    value={nasabah.no_rek}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Stack spacing={1}>
                <Button variant="outlined" component="label" startIcon={<PhotoIcon />}>
                  Ganti Foto KTP
                  <input type="file" accept="image/*" hidden onChange={handleFotoChange} />
                </Button>
                {nasabah.foto_ktp_preview && (
                  <img src={nasabah.foto_ktp_preview} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8, border: '1px solid #ddd' }} />
                )}
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" color="secondary" onClick={() => navigate(-1)} disabled={saving}>Batal</Button>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Sedang Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default EditNasabahPage;