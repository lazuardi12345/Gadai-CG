import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Grid,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from 'api/axiosInstance';

const TypePage = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [formNomorType, setFormNomorType] = useState('');
  const [formNamaType, setFormNamaType] = useState('');

  useEffect(() => {
    fetchTypes();
  }, []);

  // Fetch all types
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/type');
      console.log('API response:', response.data); // debug
      if (response.data.success) {
        setTypes(response.data.data);
      } else {
        setError(response.data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = types.filter(
    (type) =>
      type.nomor_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.nama_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (type = null) => {
    setEditingType(type);
    setFormNomorType(type?.nomor_type || '');
    setFormNamaType(type?.nama_type || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
  };

  // Save or update type
  const handleSubmit = async () => {
    if (!formNomorType || !formNamaType) {
      alert('Harap isi semua field');
      return;
    }

    try {
      const payload = { nomor_type: formNomorType, nama_type: formNamaType };
      let response;

      if (editingType) {
        response = await axiosInstance.put(`/type/${editingType.id}`, payload);
      } else {
        response = await axiosInstance.post('/type', payload);
      }

      if (response.data.success) {
        if (editingType) {
          setTypes((prev) =>
            prev.map((t) => (t.id === editingType.id ? response.data.data : t))
          );
        } else {
          setTypes((prev) => [response.data.data, ...prev]);
        }
        handleCloseDialog();
      } else {
        alert(response.data.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

  // Delete type
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus data ini?')) return;

    try {
      const response = await axiosInstance.delete(`/type/${id}`);
      if (response.data.success) {
        setTypes((prev) => prev.filter((type) => type.id !== id));
      } else {
        alert(response.data.message || 'Gagal menghapus data');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

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
      <Card>
        <CardHeader
          title="Data Type"
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                variant="outlined"
                size="small"
                placeholder="Cari nomor atau nama type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
                Tambah
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
                <TableCell>Nomor Type</TableCell>
                <TableCell>Nama Type</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? filteredTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredTypes
              ).map((type, index) => (
                <TableRow key={type.id}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{type.nomor_type}</TableCell>
                  <TableCell>{type.nama_type}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenDialog(type)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(type.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTypes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingType ? 'Edit Type' : 'Tambah Type'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nomor Type"
              fullWidth
              value={formNomorType}
              onChange={(e) => setFormNomorType(e.target.value)}
            />
            <TextField
              label="Nama Type"
              fullWidth
              value={formNamaType}
              onChange={(e) => setFormNamaType(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {editingType ? 'Update' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TypePage;
