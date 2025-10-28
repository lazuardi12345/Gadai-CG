import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Grid,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Stack,
} from '@mui/material';

import PhotoIcon from '@mui/icons-material/Photo';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import Breadcrumb from 'component/Breadcrumb';
import { gridSpacing } from 'config.js';
import axiosInstance from 'api/axiosInstance';

const DataNasabahPage = () => {
  const navigate = useNavigate();

  // State utama
  const [nasabahData, setNasabahData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination dari backend
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });

  // Modal Foto
  const [openModal, setOpenModal] = useState(false);
  const [modalFotoSrc, setModalFotoSrc] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Tambah Nasabah
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newNasabah, setNewNasabah] = useState({
    nama_lengkap: '',
    nik: '',
    alamat: '',
    no_hp: '',
    foto_ktp: null,
    foto_ktp_preview: null,
  });
  const [saving, setSaving] = useState(false);

  // Fetch data saat pertama load
  useEffect(() => {
    fetchData(pagination.current_page, pagination.per_page);
  }, []);

  // Cleanup URL.createObjectURL
  useEffect(() => {
    return () => {
      if (newNasabah.foto_ktp_preview) {
        URL.revokeObjectURL(newNasabah.foto_ktp_preview);
      }
    };
  }, [newNasabah.foto_ktp_preview]);

  // Fetch data nasabah dengan page & per_page
  const fetchData = async (page = 1, perPage = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/data-nasabah?page=${page}&per_page=${perPage}`);
      if (response.data.success) {
        setNasabahData(response.data.data || []);
        setPagination(response.data.pagination || {
          total: 0,
          per_page: perPage,
          current_page: page,
          last_page: 1,
        });
      } else {
        setNasabahData([]);
        setError(response.data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal fetch data');
      setNasabahData([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handleChangePage = (_, newPage) => {
    fetchData(newPage + 1, pagination.per_page); // backend halaman mulai dari 1
  };

  const handleChangeRowsPerPage = (event) => {
    const newPerPage = parseInt(event.target.value, 10);
    fetchData(1, newPerPage);
  };

  // Modal Foto
  const handleOpenModal = (fotoUrl) => {
    setModalFotoSrc(fotoUrl);
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setModalFotoSrc('');
  };

  // Handlers Edit & Delete
  const handleEdit = (nasabah) => navigate(`/edit-nasabah/${nasabah.id}`);

  const handleDelete = (nasabah) => {
    if (window.confirm(`Hapus nasabah ${nasabah.nama_lengkap}?`)) {
      alert(`Nasabah ${nasabah.nama_lengkap} dihapus (dummy)`);
      // fetchData(pagination.current_page, pagination.per_page); // uncomment jika API delete tersedia
    }
  };

  // Modal Tambah Nasabah
  const handleOpenAddModal = () => {
    setNewNasabah({
      nama_lengkap: '',
      nik: '',
      alamat: '',
      no_hp: '',
      foto_ktp: null,
      foto_ktp_preview: null,
    });
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleNewNasabahChange = (e) => {
    const { name, value } = e.target;
    setNewNasabah((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewNasabah((prev) => ({
        ...prev,
        foto_ktp: file,
        foto_ktp_preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSaveNasabah = async () => {
    if (!newNasabah.nama_lengkap || !newNasabah.nik) {
      alert('Nama lengkap dan NIK wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nama_lengkap', newNasabah.nama_lengkap);
      formData.append('nik', newNasabah.nik);
      formData.append('alamat', newNasabah.alamat);
      formData.append('no_hp', newNasabah.no_hp);

      if (newNasabah.foto_ktp instanceof File) {
        formData.append('foto_ktp', newNasabah.foto_ktp);
      }

      const response = await axiosInstance.post('/data-nasabah', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        alert('Data nasabah berhasil disimpan.');
        handleCloseAddModal();
        fetchData(pagination.current_page, pagination.per_page);
      } else {
        alert(response.data.message || 'Gagal menyimpan data nasabah.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan data nasabah.');
    } finally {
      setSaving(false);
    }
  };

  // Filter search di frontend
  const filteredData = nasabahData.filter((nasabah) => {
    const term = searchTerm.toLowerCase();
    return (
      nasabah.nama_lengkap.toLowerCase().includes(term) ||
      nasabah.nik.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="h6" align="center" style={{ marginTop: 20 }}>
        Error: {error}
      </Typography>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb title="Data Nasabah">
        <Typography variant="subtitle2" color="inherit" className="link-breadcrumb">
          Home
        </Typography>
        <Typography variant="subtitle2" color="primary" className="link-breadcrumb">
          Daftar Data Nasabah
        </Typography>
      </Breadcrumb>

      {/* Table Card */}
      <Grid container spacing={gridSpacing} justifyContent="center" style={{ marginTop: 10 }}>
        <Grid item xs={12} md={10}>
          <Card>
            <CardHeader
              title="Data Nasabah"
              action={
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Cari nama atau NIK..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddModal}
                  >
                    Tambah Nasabah
                  </Button>
                </Stack>
              }
            />
            <Divider />
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Nama Lengkap</TableCell>
                    <TableCell>NIK</TableCell>
                    <TableCell>Alamat</TableCell>
                    <TableCell>No HP</TableCell>
                    <TableCell>Foto</TableCell>
                    <TableCell>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Data tidak ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((nasabah, index) => (
                      <TableRow key={nasabah.id}>
                        <TableCell>{(pagination.current_page - 1) * pagination.per_page + index + 1}</TableCell>
                        <TableCell>{nasabah.nama_lengkap}</TableCell>
                        <TableCell>{nasabah.nik}</TableCell>
                        <TableCell>{nasabah.alamat}</TableCell>
                        <TableCell>{nasabah.no_hp}</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenModal(nasabah.foto_ktp)}
                            title="Lihat Foto KTP"
                            disabled={!nasabah.foto_ktp}
                          >
                            <PhotoIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEdit(nasabah)} title="Edit">
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleDelete(nasabah)} title="Hapus">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={pagination.total}
                page={pagination.current_page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={pagination.per_page}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Baris per halaman"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal Foto */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Foto KTP</DialogTitle>
        <DialogContent dividers style={{ textAlign: 'center' }}>
          <img
            src={modalFotoSrc}
            alt="Foto KTP"
            style={{ width: '100%', height: 400, borderRadius: 8, objectFit: 'cover' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Tambah Nasabah */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Nasabah</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nama Lengkap"
              name="nama_lengkap"
              value={newNasabah.nama_lengkap}
              onChange={handleNewNasabahChange}
              fullWidth
            />
            <TextField
              label="NIK"
              name="nik"
              value={newNasabah.nik}
              onChange={handleNewNasabahChange}
              fullWidth
            />
            <TextField
              label="Alamat"
              name="alamat"
              value={newNasabah.alamat}
              onChange={handleNewNasabahChange}
              fullWidth
            />
            <TextField
              label="No HP"
              name="no_hp"
              value={newNasabah.no_hp}
              onChange={handleNewNasabahChange}
              fullWidth
            />
            <Button variant="contained" component="label">
              Upload Foto KTP
              <input type="file" accept="image/*" hidden onChange={handleFotoChange} />
            </Button>
            {newNasabah.foto_ktp_preview && (
              <img
                src={newNasabah.foto_ktp_preview}
                alt="Preview Foto KTP"
                style={{ width: 300, height: 200, borderRadius: 8, objectFit: 'cover' }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal} color="secondary" disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSaveNasabah} color="primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataNasabahPage;
