import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button,
  Paper, CircularProgress, Stack, TextField, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Divider, Autocomplete, Chip, Tooltip
} from '@mui/material';
import { Print, Refresh, Add, Save, Close, ArrowBack, Edit, PhotoCamera, BrokenImage, Person, Article } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import KwitansiBgImg from '../../assets/images/kwitansi-bg.png';

// ─── Photo Thumb ───────────────────────────────────────────────────────────────
const PhotoThumb = ({ src, label, icon: Icon }) => {
  const [err, setErr] = useState(false);
  if (!src) return (
    <Tooltip title={`${label} belum diupload`}>
      <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc' }}>
        <Icon sx={{ fontSize: 16, color: '#ccc' }} />
      </Box>
    </Tooltip>
  );
  return (
    <Tooltip title={`Lihat ${label}`}>
      <Box component="a" href={src} target="_blank" rel="noopener noreferrer"
        sx={{ display: 'block', width: 40, height: 40, borderRadius: 1, overflow: 'hidden', border: '2px solid #e0e0e0', cursor: 'pointer', '&:hover': { borderColor: '#d32f2f' } }}>
        {err
          ? <Box sx={{ width: '100%', height: '100%', bgcolor: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BrokenImage sx={{ fontSize: 14, color: '#ef9a9a' }} /></Box>
          : <img src={src} alt={label} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </Box>
    </Tooltip>
  );
};

// ─── File Upload Field ─────────────────────────────────────────────────────────
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
      <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>{label}</Typography>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 60, height: 60, borderRadius: 1.5, overflow: 'hidden', border: '2px solid #e0e0e0', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {preview || currentUrl
            ? <img src={preview || currentUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Icon sx={{ fontSize: 22, color: '#bbb' }} />}
        </Box>
        <Box>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/jpg" style={{ display: 'none' }} onChange={handleFile} />
          <Button size="small" variant="outlined" startIcon={<PhotoCamera />} onClick={() => inputRef.current.click()} sx={{ borderStyle: 'dashed', fontSize: '0.72rem' }}>
            {preview ? 'Ganti' : currentUrl ? 'Ubah Foto' : 'Upload'}
          </Button>
          {fileName && <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.4 }}>✓ {fileName.length > 22 ? fileName.slice(0, 22) + '...' : fileName}</Typography>}
          {!preview && currentUrl && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.4 }}>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Lihat foto saat ini ↗</a>
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

const NotaKehilanganContent = ({ data, formatTanggalIndo }) => (
  <Box sx={{ fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '9.5pt', lineHeight: 1.5 }}>

    <Box sx={{ textAlign: 'center', mb: 1.2 }}>
      <Typography sx={{ fontSize: '11.5pt', fontWeight: 900, textDecoration: 'underline', letterSpacing: 0.3 }}>
        SURAT KETERANGAN KEHILANGAN
      </Typography>
      <Typography sx={{ fontSize: '8pt', color: '#555', mt: 0.3 }}>
        No. <b>{data?.no_nota}</b>
      </Typography>
    </Box>


    <Typography sx={{ fontSize: '7.8pt', mb: 1, fontStyle: 'italic', color: '#555', borderLeft: '2px solid #ccc', pl: 1 }}>
      Dasar: KUH Perdata Pasal 1977 &amp; UU No. 42 Tahun 1999 tentang Jaminan Fidusia
    </Typography>

    <Typography sx={{ fontSize: '9pt', mb: 1 }}>
      Yang bertanda tangan di bawah ini menerangkan bahwa nasabah berikut:
    </Typography>

    <table style={{ width: '100%', fontSize: '9pt', marginBottom: '8px', borderCollapse: 'collapse' }}>
      <tbody>
        {[
          ['Nama', data?.nasabah?.nama_lengkap, true],
          ['NIK', data?.nasabah?.nik, false],
          ['No. HP', data?.nasabah?.no_hp || '-', false],
          ['No. SBG', data?.detail_gadai?.no_gadai, true],
          ['Jenis Gadai', data?.detail_gadai?.type?.nama_type || '-', false],
        ].map(([label, value, bold]) => (
          <tr key={label}>
            <td style={{ width: '85px', padding: '1.5px 0', verticalAlign: 'top' }}>{label}</td>
            <td style={{ width: '12px' }}>:</td>
            <td style={{ fontWeight: bold ? 'bold' : 'normal', borderBottom: '1px dotted #bbb', paddingBottom: '1px' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <Typography sx={{ fontSize: '9pt', textAlign: 'justify', mb: 0.8 }}>
      Menyatakan bahwa nasabah tersebut di atas telah <b>kehilangan nota/bukti gadai</b> atas nomor SBG sebagaimana
      tercantum. Surat ini berlaku sebagai pengganti nota yang hilang untuk keperluan pelunasan dan pengambilan
      barang jaminan sesuai ketentuan <b>PT. Solusi Gadai Indonesia</b>.
    </Typography>

    <Typography sx={{ fontSize: '8.5pt', textAlign: 'justify', color: '#333', mb: 1.5 }}>
      Nasabah bertanggung jawab penuh atas segala risiko akibat kehilangan nota tersebut dan membebaskan
      perusahaan dari tuntutan pihak manapun di kemudian hari.
    </Typography>

    <Box sx={{ textAlign: 'right', mb: 0.8 }}>
      <Typography sx={{ fontSize: '9pt' }}>Bogor, {formatTanggalIndo(data?.created_at || new Date())}</Typography>
    </Box>


<Grid container sx={{ textAlign: 'center' }}>
  <Grid item xs={6}>
    <Typography sx={{ fontSize: '8.5pt' }}>Nasabah,</Typography>

    {/* Ruang TTD nasabah */}
    <Box sx={{ height: '20px' }} />

    {/* Kotak Materai — lebih besar */}
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: '12px' }}>
      <Box sx={{
        border: '1px dashed #aaa', borderRadius: 1, px: 2, py: 1.5,
        fontSize: '7pt', color: '#888', fontFamily: 'Arial', textAlign: 'center', lineHeight: 1.6,
        minWidth: '65px', minHeight: '38px'
      }}>
        MATERAI<br />Rp 10.000
      </Box>
    </Box>

    {/* Garis TTD + Nama */}
    <Box sx={{ borderTop: '1px solid #000', mx: 4, pt: '4px' }}>
      <Typography sx={{ fontWeight: 'bold', fontSize: '8.5pt' }}>{data?.nasabah?.nama_lengkap}</Typography>
      <Typography sx={{ fontSize: '7.5pt', color: '#555' }}>NIK: {data?.nasabah?.nik}</Typography>
    </Box>
  </Grid>

  <Grid item xs={6}>
    <Typography sx={{ fontSize: '8.5pt' }}>Petugas,</Typography>
    <Box sx={{ height: '94px' }} />

    <Box sx={{ borderTop: '1px solid #000', mx: 4, pt: '4px' }}>
      <Typography sx={{ fontWeight: 'bold', fontSize: '8.5pt' }}>PT. Solusi Gadai Indonesia</Typography>
      <Typography sx={{ fontSize: '7.5pt', color: '#555' }}>( ............................... )</Typography>
    </Box>
  </Grid>
</Grid>
  </Box>
);

const NotaKehilanganBlock = ({ data, formatTanggalIndo }) => (
  <Box sx={{ 
    width: '210mm', height: '148.5mm', position: 'relative', 
    p: '18mm 18mm 10mm 18mm', boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif', color: '#000'
  }}>
    <img src={KwitansiBgImg} alt="bg" 
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <NotaKehilanganContent data={data} formatTanggalIndo={formatTanggalIndo} />
    </Box>
  </Box>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const DaftarNotaKehilangan = () => {
  const [loading, setLoading]                     = useState(false);
  const [searchLoading, setSearchLoading]         = useState(false);
  const [dataList, setDataList]                   = useState([]);
  const [options, setOptions]                     = useState([]);
  const [fullDataCetak, setFullDataCetak]         = useState(null);
  const [viewMode, setViewMode]                   = useState('list');
  const [tanggal, setTanggal]                     = useState(new Date().toISOString().split('T')[0]);
  const [openModal, setOpenModal]                 = useState(false);
  const [selectedGadaiInfo, setSelectedGadaiInfo] = useState(null);
  const [formData, setFormData]                   = useState({ detail_gadai_id: '' });
  const [createFiles, setCreateFiles]             = useState({});
  const [openEditModal, setOpenEditModal]         = useState(false);
  const [editTarget, setEditTarget]               = useState(null);
  const [editFiles, setEditFiles]                 = useState({});

  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/nota-kehilangan', { params: { tanggal } });
      if (res.data.success) setDataList(res.data.data);
    } catch (err) { console.error('Gagal load', err); }
    finally { setLoading(false); }
  }, [tanggal]);

  useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

  const handleSearchGadai = async (val) => {
    if (val.length < 3) { setOptions([]); return; }
    setSearchLoading(true);
    try {
      const res = await axiosInstance.get('/nota-kehilangan/search-gadai', { params: { q: val } });
      if (res.data.success) setOptions(res.data.data);
    } catch (err) { console.error(err); }
    finally { setTimeout(() => setSearchLoading(false), 300); }
  };

  const handlePreparePrint = async (row) => {
    try {
      setFullDataCetak(null);
      const res = await axiosInstance.get(`/nota-kehilangan/${row.id}`);
      if (res.data.success) { setFullDataCetak(res.data.data); setViewMode('print'); }
    } catch (err) { console.error(err); alert('Gagal ambil data'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.detail_gadai_id) return alert('Pilih No. Gadai dulu!');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('detail_gadai_id', formData.detail_gadai_id);
      Object.entries(createFiles).forEach(([k, v]) => fd.append(k, v));
      const res = await axiosInstance.post('/nota-kehilangan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        alert('Nota Kehilangan berhasil disimpan!');
        setOpenModal(false);
        fetchRiwayat();
        setFullDataCetak(res.data.data);
        setViewMode('print');
      }
    } catch (err) { alert(err.response?.data?.message || 'Gagal simpan'); }
    finally { setLoading(false); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(editFiles).forEach(([k, v]) => fd.append(k, v));
      const res = await axiosInstance.post(`/nota-kehilangan/${editTarget.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) { alert('Data berhasil diperbarui!'); setOpenEditModal(false); fetchRiwayat(); }
    } catch (err) { alert(err.response?.data?.message || 'Gagal update'); }
    finally { setLoading(false); }
  };

  const formatTanggalIndo = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
  };

  // ══ PRINT VIEW ══════════════════════════════════════════════════════════════
  if (viewMode === 'print') {
    const data = fullDataCetak;
    return (
      <Box>
        <Stack direction="row" spacing={2} justifyContent="center" className="no-print"
          sx={{ p: 3, bgcolor: '#455a64' }}>
          <Button variant="contained" color="inherit" startIcon={<ArrowBack />}
            onClick={() => { setViewMode('list'); fetchRiwayat(); }}>Kembali</Button>
          <Button variant="contained" color="error" startIcon={<Print />} onClick={() => window.print()}>Cetak</Button>
        </Stack>

        {/* Area Print (hidden di screen) */}
        <Box className="print-container">
          <NotaKehilanganBlock data={data} formatTanggalIndo={formatTanggalIndo} />
        </Box>

        {/* Screen Preview — tampil half A4 */}
        <Box className="no-print" sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#455a64', minHeight: '100vh', pb: 10, pt: 4 }}>
          <Box sx={{ width: '210mm', height: '148.5mm', position: 'relative', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,0,0,0.6)', borderRadius: 1 }}>
            <img src={KwitansiBgImg} alt="bg"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
            <Box sx={{ position: 'relative', zIndex: 1, p: '18mm 18mm 10mm 18mm', height: '100%', boxSizing: 'border-box' }}>
              <NotaKehilanganContent data={data} formatTanggalIndo={formatTanggalIndo} />
            </Box>
          </Box>
        </Box>

        <style>{`
  @media screen { .print-container { display: none; } }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    body * { visibility: hidden; }
    .print-container, .print-container * { visibility: visible !important; }
    .print-container { position: absolute; top: 0; left: 0; width: 210mm; }
    .no-print { display: none !important; }
  }
`}</style>
      </Box>
    );
  }

  // ══ LIST VIEW ═══════════════════════════════════════════════════════════════
  return (
    <Box sx={{ p: 3, bgcolor: '#455a64', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight="bold" color="error">Nota Kehilangan</Typography>
            <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchRiwayat} disabled={loading}>Refresh</Button>
          </Stack>
          <Button variant="contained" color="error" startIcon={<Add />}
            onClick={() => { setFormData({ detail_gadai_id: '' }); setSelectedGadaiInfo(null); setCreateFiles({}); setOpenModal(true); }}>
            Buat Nota Baru
          </Button>
        </Stack>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>NO. NOTA</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>NO. GADAI</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>NASABAH</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>JENIS GADAI</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>DOKUMEN FOTO</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>TGL DIBUAT</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">AKSI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
            ) : dataList.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#aaa' }}>Belum ada nota kehilangan.</TableCell></TableRow>
            ) : dataList.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell><Chip label={row.no_nota} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                <TableCell><Typography variant="body2" fontWeight="bold" color="primary">{row.detail_gadai?.no_gadai}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{row.nasabah?.nama_lengkap}</Typography>
                  <Typography variant="caption" color="textSecondary">NIK: {row.nasabah?.nik}</Typography>
                </TableCell>
                <TableCell><Chip label={row.detail_gadai?.type?.nama_type || '-'} size="small" /></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block', mb: 0.2 }}>Foto Nasabah</Typography>
                      <PhotoThumb src={row.foto_nasabah} label="Foto Nasabah" icon={Person} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block', mb: 0.2 }}>Foto Nota</Typography>
                      <PhotoThumb src={row.foto_nota_ilang} label="Foto Nota Hilang" icon={Article} />
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell><Typography variant="body2">{formatTanggalIndo(row.created_at)}</Typography></TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Edit Foto">
                      <IconButton size="small" color="warning" onClick={() => { setEditTarget(row); setEditFiles({}); setOpenEditModal(true); }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button variant="contained" size="small" color="error" startIcon={<Print />} onClick={() => handlePreparePrint(row)}>
                      Cetak
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Modal Buat ─────────────────────────────────────────────────────────── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Buat Nota Kehilangan Baru <IconButton onClick={() => setOpenModal(false)}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={options} loading={searchLoading} filterOptions={(x) => x}
                  getOptionLabel={(opt) => opt.no_gadai ? `${opt.no_gadai} - ${opt.nasabah?.nama_lengkap}` : ''}
                  isOptionEqualToValue={(o, v) => o.id === v?.id}
                  onInputChange={(e, v) => handleSearchGadai(v)}
                  onChange={(e, v) => { setFormData({ detail_gadai_id: v?.id || '' }); setSelectedGadaiInfo(v); }}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{opt.no_gadai}</Typography>
                        <Typography variant="caption">{opt.nasabah?.nama_lengkap} · {opt.type?.nama_type}</Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Cari No. Gadai / Nama Nasabah" required placeholder="Ketik minimal 3 karakter..."
                      InputProps={{ ...params.InputProps, endAdornment: <>{searchLoading ? <CircularProgress size={20} /> : null}{params.InputProps.endAdornment}</> }} />
                  )}
                />
              </Grid>
              {selectedGadaiInfo && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffcc02' }}>
                    <Typography variant="caption" color="warning.dark" fontWeight="bold">DATA NASABAH:</Typography>
                    <Typography variant="body2"><b>{selectedGadaiInfo.nasabah?.nama_lengkap}</b></Typography>
                    <Typography variant="body2">NIK: {selectedGadaiInfo.nasabah?.nik} · HP: {selectedGadaiInfo.nasabah?.no_hp}</Typography>
                    <Typography variant="caption">Alamat: {selectedGadaiInfo.nasabah?.alamat}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="primary">
                      Jenis: <b>{selectedGadaiInfo.type?.nama_type}</b> · No. SBG: <b>{selectedGadaiInfo.no_gadai}</b>
                    </Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="textSecondary">UPLOAD DOKUMEN FOTO (OPSIONAL)</Typography></Divider>
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadField label="Foto Nasabah" name="foto_nasabah" currentUrl={null}
                  onChange={(name, file) => setCreateFiles(p => ({ ...p, [name]: file }))} icon={Person} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadField label="Foto Nota Hilang" name="foto_nota_ilang" currentUrl={null}
                  onChange={(name, file) => setCreateFiles(p => ({ ...p, [name]: file }))} icon={Article} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
            <Button type="submit" variant="contained" color="error" startIcon={<Save />} disabled={loading}>
              {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null} Simpan & Cetak
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Modal Edit Foto ────────────────────────────────────────────────────── */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography fontWeight="bold">Edit Foto Nota Kehilangan</Typography>
            {editTarget && <Typography variant="caption" color="textSecondary">{editTarget.no_nota} · {editTarget.nasabah?.nama_lengkap}</Typography>}
          </Box>
          <IconButton onClick={() => setOpenEditModal(false)}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              {editTarget && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: '#f3f4f6', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" fontWeight="bold">INFO GADAI:</Typography>
                    <Typography variant="body2"><b>{editTarget.detail_gadai?.no_gadai}</b> · {editTarget.detail_gadai?.type?.nama_type}</Typography>
                    <Typography variant="body2">{editTarget.nasabah?.nama_lengkap} · NIK: {editTarget.nasabah?.nik}</Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <FileUploadField label="Foto Nasabah" name="foto_nasabah" currentUrl={editTarget?.foto_nasabah}
                  onChange={(name, file) => setEditFiles(p => ({ ...p, [name]: file }))} icon={Person} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadField label="Foto Nota Hilang" name="foto_nota_ilang" currentUrl={editTarget?.foto_nota_ilang}
                  onChange={(name, file) => setEditFiles(p => ({ ...p, [name]: file }))} icon={Article} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, bgcolor: '#fff8e1', borderRadius: 1, border: '1px solid #ffe082' }}>
                  <Typography variant="caption" color="warning.dark">⚠️ Kosongkan jika tidak ingin mengubah foto. Format: JPG/PNG, maks 2MB.</Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => setOpenEditModal(false)} color="inherit">Batal</Button>
            <Button type="submit" variant="contained" color="warning" startIcon={<Save />} disabled={loading}>
              {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null} Simpan Perubahan
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DaftarNotaKehilangan;