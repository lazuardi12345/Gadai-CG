import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Grid, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Box, Stack, CircularProgress, Paper, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Divider, Autocomplete, Avatar, Chip, Tooltip, Badge
} from '@mui/material';
import {
  Print, Refresh, Add, Save, Close, ArrowBack, Edit,
  PhotoCamera, BrokenImage, Visibility, Person, Article
} from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import KopSuratImg from 'assets/images/Kop SUrat.png';

// ─── Photo Preview Component ───────────────────────────────────────────────
const PhotoPreview = ({ src, label, icon: Icon }) => {
  const [err, setErr] = useState(false);
  if (!src) return (
    <Box sx={{
      width: 48, height: 48, borderRadius: 1.5, bgcolor: '#f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px dashed #ccc'
    }}>
      <Icon sx={{ fontSize: 20, color: '#bbb' }} />
    </Box>
  );
  return (
    <Tooltip title={`Lihat ${label}`} arrow>
      <Box
        component="a" href={src} target="_blank" rel="noopener noreferrer"
        sx={{
          display: 'block', width: 48, height: 48, borderRadius: 1.5,
          overflow: 'hidden', border: '2px solid #e0e0e0', cursor: 'pointer',
          transition: 'border-color 0.2s',
          '&:hover': { borderColor: '#1976d2' }
        }}
      >
        {err ? (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrokenImage sx={{ fontSize: 18, color: '#ef9a9a' }} />
          </Box>
        ) : (
          <img src={src} alt={label} onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </Box>
    </Tooltip>
  );
};

// ─── File Upload Field ─────────────────────────────────────────────────────
const FileUploadField = ({ label, name, currentUrl, onChange, icon: Icon }) => {
  const inputRef = useRef();
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onChange(name, file);
  };

  return (
    <Box>
      <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {/* Preview */}
        <Box sx={{
          width: 64, height: 64, borderRadius: 2, overflow: 'hidden',
          border: '2px solid #e0e0e0', bgcolor: '#fafafa',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {preview || currentUrl ? (
            <img src={preview || currentUrl} alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Icon sx={{ fontSize: 24, color: '#bbb' }} />
          )}
        </Box>
        {/* Upload Button */}
        <Box>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/jpg"
            style={{ display: 'none' }} onChange={handleFile} />
          <Button size="small" variant="outlined" startIcon={<PhotoCamera />}
            onClick={() => inputRef.current.click()}
            sx={{ borderStyle: 'dashed', fontSize: '0.75rem' }}>
            {preview ? 'Ganti' : currentUrl ? 'Ubah Foto' : 'Upload'}
          </Button>
          {fileName && (
            <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
              ✓ {fileName.length > 20 ? fileName.slice(0, 20) + '...' : fileName}
            </Typography>
          )}
          {!preview && currentUrl && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                Lihat foto saat ini ↗
              </a>
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const SuratKuasaPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editFiles, setEditFiles] = useState({});

  const [formData, setFormData] = useState({
    detail_gadai_id: '', wakil_nama: '', wakil_nik: '',
    wakil_alamat: '', wakil_hp: '', wakil_hubungan: ''
  });
  const [editFormData, setEditFormData] = useState({
    wakil_nama: '', wakil_nik: '', wakil_alamat: '', wakil_hp: '', wakil_hubungan: ''
  });
  const [selectedGadaiInfo, setSelectedGadaiInfo] = useState(null);

  // ── Fetch List ────────────────────────────────────────────────────────────
  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/surat-kuasa');
      if (res.data.success) setRiwayat(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil riwayat');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

  // ── Search Gadai ──────────────────────────────────────────────────────────
  const handleSearchGadai = async (val) => {
    if (val.length < 3) { setOptions([]); return; }
    setSearchLoading(true);
    try {
      const res = await axiosInstance.get('/surat-kuasa/search-gadai', { params: { q: val } });
      if (res.data.success) setOptions(res.data.data);
    } catch (err) { console.error(err); }
    finally {
      setTimeout(() => setSearchLoading(false), 300);
    }
  };

  // ── Submit Create ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.detail_gadai_id) return alert('Pilih No. Gadai dulu!');
    setLoading(true);
    try {
      const res = await axiosInstance.patch(`/surat-kuasa/create/${formData.detail_gadai_id}`, formData);
      if (res.data.success) {
        alert('Surat Kuasa Berhasil Disimpan!');
        setOpenModal(false);
        fetchRiwayat();
        setSelectedSurat(res.data.data);
        setViewMode('print');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal simpan data');
    } finally { setLoading(false); }
  };

  // ── Open Edit Modal ───────────────────────────────────────────────────────
  const handleOpenEdit = (row) => {
    setEditTarget(row);
    setEditFiles({});
    setEditFormData({
      wakil_nama: row.wakil_nama || '',
      wakil_nik: row.wakil_nik || '',
      wakil_alamat: row.wakil_alamat || '',
      wakil_hp: row.wakil_hp || '',
      wakil_hubungan: row.wakil_hubungan || '',
    });
    setOpenEditModal(true);
  };

  // ── Submit Edit ───────────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(editFormData).forEach(([k, v]) => fd.append(k, v));
      Object.entries(editFiles).forEach(([k, v]) => fd.append(k, v));
      fd.append('_method', 'PATCH');

      const res = await axiosInstance.post(`/surat-kuasa/update/${editTarget.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert('Data berhasil diperbarui!');
        setOpenEditModal(false);
        fetchRiwayat();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal update data');
    } finally { setLoading(false); }
  };

  // ── Cetak / Detail ────────────────────────────────────────────────────────
  const handleDetailCetak = async (idGadai) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/surat-kuasa/cetak/${idGadai}`);
      if (res.data.success) { setSelectedSurat(res.data.data); setViewMode('print'); }
    } catch (err) { alert('Data tidak ditemukan.'); }
    finally { setLoading(false); }
  };

  const formatTanggalIndo = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'list') {
    return (
      <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
        <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">Surat Kuasa Pelunasan</Typography>
              <Typography variant="caption" color="textSecondary">
                Manajemen surat kuasa pelunasan & pengambilan jaminan
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={fetchRiwayat} disabled={loading}>
                Refresh
              </Button>
              <Button variant="contained" startIcon={<Add />} color="success"
                onClick={() => {
                  setFormData({ detail_gadai_id: '', wakil_nama: '', wakil_nik: '', wakil_alamat: '', wakil_hp: '', wakil_hubungan: '' });
                  setSelectedGadaiInfo(null);
                  setOpenModal(true);
                }}>
                Buat Surat Baru
              </Button>
            </Stack>
          </Stack>

          {/* Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>No. Gadai</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pemberi Kuasa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Penerima Kuasa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Dokumen Foto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tgl Dibuat</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && riwayat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={24} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : riwayat.map((row) => (
                  <TableRow key={row.id} hover>
                    {/* No Gadai */}
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {row.detail_gadai?.no_gadai}
                      </Typography>
                      <Chip
                        label={row.detail_gadai?.status}
                        size="small"
                        color={row.detail_gadai?.status === 'selesai' ? 'success' : 'default'}
                        sx={{ mt: 0.5, fontSize: '0.65rem', height: 18 }}
                      />
                    </TableCell>

                    {/* Pemberi Kuasa */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{row.pemberi_kuasa?.nama_lengkap}</Typography>
                      <Typography variant="caption" color="textSecondary">NIK: {row.pemberi_kuasa?.nik}</Typography>
                    </TableCell>

                    {/* Penerima Kuasa */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{row.wakil_nama}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.wakil_hubungan} · {row.wakil_hp}
                      </Typography>
                    </TableCell>

                    {/* Dokumen Foto ← NEW */}
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block', mb: 0.3 }}>
                            Foto Wakil
                          </Typography>
                          <PhotoPreview src={row.foto_wakil} label="Foto Wakil" icon={Person} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block', mb: 0.3 }}>
                            Foto Surat
                          </Typography>
                          <PhotoPreview src={row.foto_surat} label="Foto Surat" icon={Article} />
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Tanggal */}
                    <TableCell>
                      <Typography variant="body2">{formatTanggalIndo(row.created_at)}</Typography>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit Data & Foto">
                          <IconButton size="small" color="warning" onClick={() => handleOpenEdit(row)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cetak Surat">
                          <IconButton size="small" color="primary" onClick={() => handleDetailCetak(row.detail_gadai_id)}>
                            <Print fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && riwayat.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#aaa' }}>
                      Belum ada riwayat surat kuasa.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* ── Modal Buat Surat Baru ──────────────────────────────────────────── */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Buat Surat Kuasa Baru
            <IconButton onClick={() => setOpenModal(false)}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={options}
                    loading={searchLoading}
                    filterOptions={(x) => x}
                    getOptionLabel={(opt) => opt.no_gadai ? `${opt.no_gadai} - ${opt.nasabah?.nama_lengkap}` : ''}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    onInputChange={(e, v) => handleSearchGadai(v)}
                    onChange={(e, v) => {
                      setFormData({ ...formData, detail_gadai_id: v?.id || '' });
                      setSelectedGadaiInfo(v);
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{option.no_gadai}</Typography>
                          <Typography variant="caption">{option.nasabah?.nama_lengkap} - {option.nasabah?.nik}</Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Cari No. Gadai / Nama Nasabah" required
                        placeholder="Ketik minimal 3 karakter..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                {selectedGadaiInfo && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
                      <Typography variant="caption" color="primary" fontWeight="bold">DATA PEMBERI KUASA (NASABAH):</Typography>
                      <Typography variant="body2"><b>{selectedGadaiInfo.nasabah?.nama_lengkap}</b></Typography>
                      <Typography variant="body2">NIK: {selectedGadaiInfo.nasabah?.nik}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        Alamat: {selectedGadaiInfo.nasabah?.alamat}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider><Typography variant="caption" color="textSecondary">DATA PENERIMA KUASA (WAKIL)</Typography></Divider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Nama Lengkap Wakil" required
                    value={formData.wakil_nama} onChange={(e) => setFormData({ ...formData, wakil_nama: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="NIK Wakil" required
                    value={formData.wakil_nik} onChange={(e) => setFormData({ ...formData, wakil_nik: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="No. HP Wakil" required
                    value={formData.wakil_hp} onChange={(e) => setFormData({ ...formData, wakil_hp: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Hubungan" required select
                    value={formData.wakil_hubungan} onChange={(e) => setFormData({ ...formData, wakil_hubungan: e.target.value })}>
                    <MenuItem value="Suami/Istri">Suami/Istri</MenuItem>
                    <MenuItem value="Anak Kandung">Anak Kandung</MenuItem>
                    <MenuItem value="Keluarga">Keluarga</MenuItem>
                    <MenuItem value="Lainnya">Lainnya</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Alamat Lengkap Wakil" multiline rows={2} required
                    value={formData.wakil_alamat} onChange={(e) => setFormData({ ...formData, wakil_alamat: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
              <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
              <Button type="submit" variant="contained" color="success" startIcon={<Save />} disabled={loading}>
                {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                Simpan & Cetak
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* ── Modal Edit (dengan upload foto) ───────────────────────────────── */}
        <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography fontWeight="bold">Edit Surat Kuasa</Typography>
              {editTarget && (
                <Typography variant="caption" color="textSecondary">
                  {editTarget.detail_gadai?.no_gadai} · {editTarget.pemberi_kuasa?.nama_lengkap}
                </Typography>
              )}
            </Box>
            <IconButton onClick={() => setOpenEditModal(false)}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <form onSubmit={handleEditSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Nama Lengkap Wakil" required
                    value={editFormData.wakil_nama}
                    onChange={(e) => setEditFormData({ ...editFormData, wakil_nama: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="NIK Wakil" required
                    value={editFormData.wakil_nik}
                    onChange={(e) => setEditFormData({ ...editFormData, wakil_nik: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="No. HP Wakil" required
                    value={editFormData.wakil_hp}
                    onChange={(e) => setEditFormData({ ...editFormData, wakil_hp: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Hubungan" required select
                    value={editFormData.wakil_hubungan}
                    onChange={(e) => setEditFormData({ ...editFormData, wakil_hubungan: e.target.value })}>
                    <MenuItem value="Suami/Istri">Suami/Istri</MenuItem>
                    <MenuItem value="Anak Kandung">Anak Kandung</MenuItem>
                    <MenuItem value="Keluarga">Keluarga</MenuItem>
                    <MenuItem value="Lainnya">Lainnya</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Alamat Lengkap Wakil" multiline rows={2} required
                    value={editFormData.wakil_alamat}
                    onChange={(e) => setEditFormData({ ...editFormData, wakil_alamat: e.target.value })} />
                </Grid>

                {/* Upload Foto Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" color="textSecondary">UPLOAD DOKUMEN FOTO</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FileUploadField
                    label="Foto KTP / Identitas Wakil"
                    name="foto_wakil"
                    currentUrl={editTarget?.foto_wakil}
                    onChange={(name, file) => setEditFiles((prev) => ({ ...prev, [name]: file }))}
                    icon={Person}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FileUploadField
                    label="Foto Surat Kuasa Fisik"
                    name="foto_surat"
                    currentUrl={editTarget?.foto_surat}
                    onChange={(name, file) => setEditFiles((prev) => ({ ...prev, [name]: file }))}
                    icon={Article}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, bgcolor: '#fff8e1', borderRadius: 1, border: '1px solid #ffe082' }}>
                    <Typography variant="caption" color="warning.dark">
                      ⚠️ Upload foto bersifat opsional. Kosongkan jika tidak ingin mengubah foto.
                      Format: JPG/PNG, maks 2MB.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
              <Button onClick={() => setOpenEditModal(false)} color="inherit">Batal</Button>
              <Button type="submit" variant="contained" color="warning" startIcon={<Save />} disabled={loading}>
                {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                Simpan Perubahan
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRINT VIEW
  // ══════════════════════════════════════════════════════════════════════════
  const data = selectedSurat;

  return (
    <Box sx={{ p: 0, m: 0 }}>
      <Stack
        direction="row" spacing={2} justifyContent="center" className="no-print"
        sx={{ p: 3, bgcolor: '#455a64', display: 'flex' }}
      >
        <Button variant="contained" color="inherit" startIcon={<ArrowBack />} onClick={() => setViewMode('list')}>
          Kembali
        </Button>
        <Button variant="contained" color="primary" startIcon={<Print />} onClick={() => window.print()}>
          Cetak
        </Button>
      </Stack>

      <Box sx={{
        display: 'flex', justifyContent: 'center', bgcolor: '#455a64',
        minHeight: '100vh', pb: 10,
        '@media print': { bgcolor: '#fff', p: 0, m: 0, display: 'block' }
      }}>
        <Paper
          className="print-paper"
          sx={{
            width: '210mm', minHeight: '297mm', p: '45mm 20mm 20mm 20mm',
            backgroundImage: `url("${KopSuratImg}")`, backgroundSize: '100% auto',
            backgroundRepeat: 'no-repeat', bgcolor: '#fff',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column',
            '@media print': { boxShadow: 'none', m: '0 auto', p: '45mm 20mm 20mm 20mm' }
          }}
        >
          <Typography variant="h6" align="center"
            sx={{ fontWeight: 900, textDecoration: 'underline', mb: 5, fontSize: '1.2rem' }}>
            SURAT KUASA PELUNASAN & PENGAMBILAN JAMINAN
          </Typography>

          <Typography sx={{ fontSize: '1rem', mb: 2 }}>Yang bertanda tangan di bawah ini (Pemberi Kuasa):</Typography>
          <Box sx={{ ml: 4, mb: 4 }}>
            <Grid container spacing={1}>
              <Grid item xs={3}><Typography>Nama</Typography></Grid>
              <Grid item xs={9}><Typography>: <b>{data?.pemberi_kuasa?.nama_lengkap}</b></Typography></Grid>
              <Grid item xs={3}><Typography>NIK</Typography></Grid>
              <Grid item xs={9}><Typography>: {data?.pemberi_kuasa?.nik}</Typography></Grid>
              <Grid item xs={3}><Typography>No. HP</Typography></Grid>
              <Grid item xs={9}><Typography>: {data?.pemberi_kuasa?.no_hp || '-'}</Typography></Grid>
              <Grid item xs={3}><Typography>Alamat</Typography></Grid>
              <Grid item xs={9}><Typography>: {data?.pemberi_kuasa?.alamat}</Typography></Grid>
            </Grid>
          </Box>

          <Typography sx={{ fontSize: '1rem', mb: 2 }}>Memberikan kuasa sepenuhnya kepada (Penerima Kuasa):</Typography>
          <Box sx={{ ml: 4, mb: 4 }}>
            <Grid container spacing={1}>
              <Grid item xs={3}><Typography>Nama</Typography></Grid>
              <Grid item xs={9}><Typography>: <b>{data?.wakil_nama}</b></Typography></Grid>
              <Grid item xs={3}><Typography>NIK</Typography></Grid>
              <Grid item xs={9}><Typography>: {data?.wakil_nik}</Typography></Grid>
              <Grid item xs={3}><Typography>No. HP</Typography></Grid>
              <Grid item xs={9}><Typography>: {data?.wakil_hp || '-'}</Typography></Grid>
              <Grid item xs={3}><Typography>Hubungan</Typography></Grid>
              <Grid item xs={9}><Typography>: {data?.wakil_hubungan}</Typography></Grid>
              <Grid item xs={3}><Typography>Alamat</Typography></Grid>
              <Grid item xs={9}><Typography>: {data?.wakil_alamat}</Typography></Grid>
            </Grid>
          </Box>

          <Typography sx={{ textAlign: 'justify', lineHeight: 1.8, textIndent: '40px', mb: 6 }}>
            Untuk melakukan <b>Pelunasan</b> dan <b>Pengambilan Barang Jaminan</b> atas nomor gadai{' '}
            <b>{data?.detail_gadai?.no_gadai}</b>. Segala akibat dan risiko yang timbul dari pemberian kuasa ini
            sepenuhnya menjadi tanggung jawab saya sebagai Pemberi Kuasa dan membebaskan pihak perusahaan dari
            segala tuntutan hukum di kemudian hari.
          </Typography>

          <Box sx={{ textAlign: 'right', pr: 6, mb: 2 }}>
            <Typography>Bogor, {formatTanggalIndo(data?.created_at || new Date())}</Typography>
          </Box>

          <Grid container sx={{ textAlign: 'center' }}>
            <Grid item xs={6}>
              <Typography sx={{ mb: 10 }}>Penerima Kuasa,</Typography>
              <Box sx={{ borderTop: '1px solid #000', mx: 5, pt: 1 }}>
                <Typography sx={{ fontWeight: 'bold' }}>{data?.wakil_nama}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ mb: 2 }}>Pemberi Kuasa,</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'inline-block', border: '1px dashed #ccc', p: 1, opacity: 0.5, fontSize: '0.6rem' }}>
                  MATERAI 10.000
                </Box>
              </Box>
              <Box sx={{ borderTop: '1px solid #000', mx: 5, pt: 1, mt: 4 }}>
                <Typography sx={{ fontWeight: 'bold' }}>{data?.pemberi_kuasa?.nama_lengkap}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <style>{`
        @media print {
          .no-print, nav, aside, header, .MuiDrawer-root { display: none !important; }
          body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          .print-paper {
            width: 210mm !important; height: 297mm !important;
            position: absolute !important; left: 0 !important;
            top: 0 !important; margin: 0 !important; box-shadow: none !important;
          }
          @page { size: A4; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; }
        }
      `}</style>
    </Box>
  );
};

export default SuratKuasaPage;  