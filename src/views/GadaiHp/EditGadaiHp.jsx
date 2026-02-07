import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  Box, Grid, Typography, Stack, Button, CircularProgress, Paper,
  TextField, Checkbox, Divider, Select, MenuItem, Dialog, DialogContent, IconButton, Chip
} from "@mui/material";
import { ArrowBack, Close, PhotoCamera, Folder, Save, Person, ReceiptLong, CheckBox as CheckBoxIcon, DeleteForever } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import imageCompression from 'browser-image-compression';

const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  SONY: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian'],
};

const baseStorageUrl = (path) => 
  path ? (path.startsWith("http") ? path : `http://192.182.6.107:8000/storage/${path}`) : null;

const EditGadaiHpPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const userRole = (user?.role || "").toLowerCase();
  const prefix = userRole === "checker" ? "/checker" : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({});
  const [grades, setGrades] = useState([]);
  const [kerusakanList, setKerusakanList] = useState([]);
  const [kelengkapanList, setKelengkapanList] = useState([]);
  const [gradeNominal, setGradeNominal] = useState(0);
  const [totalPotonganKerusakan, setTotalPotonganKerusakan] = useState(0);
  const [totalKelengkapan, setTotalKelengkapan] = useState(0);
  const [dokumenFiles, setDokumenFiles] = useState({});
  const [removedFiles, setRemovedFiles] = useState([]); // Track file yang dihapus
  const [openPreview, setOpenPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchData = async () => {
    if (!userRole) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`${prefix}/gadai-hp/${id}`);
      const raw = res.data.data;
      setData(raw);
      setGradeNominal(Number(raw.grade_nominal) || 0);

      const gList = raw.grade ? [
        { value: "a_dus", label: "A DUS", nominal: raw.grade.grade_a_dus },
        { value: "a_tanpa_dus", label: "A TANPA DUS", nominal: raw.grade.grade_a_tanpa_dus },
        { value: "b_dus", label: "B DUS", nominal: raw.grade.grade_b_dus },
        { value: "b_tanpa_dus", label: "B TANPA DUS", nominal: raw.grade.grade_b_tanpa_dus },
        { value: "c_dus", label: "C DUS", nominal: raw.grade.grade_c_dus },
        { value: "c_tanpa_dus", label: "C TANPA DUS", nominal: raw.grade.grade_c_tanpa_dus },
      ] : [{ value: raw.grade_type, label: (raw.grade_type || "").replace(/_/g, ' ').toUpperCase(), nominal: raw.grade_nominal }];
      setGrades(gList);

      const [kerRes, kelRes] = await Promise.all([
        axiosInstance.get(`${prefix}/kerusakan`),
        axiosInstance.get(`${prefix}/kelengkapan`)
      ]);

      const currentGradeNom = Number(raw.grade_nominal) || 0;
      setKerusakanList((kerRes.data.data.items || []).map((m) => {
        const exist = raw.kerusakan_list?.find((r) => r.id === m.id);
        const autoPotongan = (Number(m.persen) / 100) * currentGradeNom;
        return {
          id: m.id,
          nama: m.nama_kerusakan,
          nominal_override: exist ? (exist.pivot?.nominal_override ?? autoPotongan) : autoPotongan,
          checked: !!exist,
        };
      }));

      setKelengkapanList((kelRes.data.data.items || []).map((m) => {
        const exist = raw.kelengkapan_list?.find((r) => r.id === m.id);
        return {
          id: m.id,
          nama: m.nama_kelengkapan,
          nominal_override: exist ? (exist.pivot?.nominal_override ?? 0) : 0,
          checked: !!exist,
        };
      }));
    } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id, userRole]);

  useEffect(() => {
    const potongan = kerusakanList.filter(x => x.checked).reduce((s, i) => s + (Number(i.nominal_override) || 0), 0);
    const penambah = kelengkapanList.filter(x => x.checked).reduce((s, i) => s + (Number(i.nominal_override) || 0), 0);
    setTotalPotonganKerusakan(potongan);
    setTotalKelengkapan(penambah);
  }, [kerusakanList, kelengkapanList, gradeNominal]);

  const finalTaksiran = useMemo(() => gradeNominal - totalPotonganKerusakan + totalKelengkapan, [gradeNominal, totalPotonganKerusakan, totalKelengkapan]);



const handleFileChange = async (key, file) => {
  if (!file) return;

  const options = {
    maxSizeMB: 0.8,       
    maxWidthOrHeight: 1920,   
    useWebWorker: true,
    initialQuality: 0.8       
  };

  try {

    const compressedFile = await imageCompression(file, options);

    const uniqueFile = new File([compressedFile], `${key}_${Date.now()}.jpg`, { 
      type: "image/jpeg" 
    });

    setDokumenFiles(prev => ({ ...prev, [key]: uniqueFile }));
    setRemovedFiles(prev => prev.filter(item => item !== key));
    
    console.log(`Original: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`Compressed: ${(compressedFile.size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error("Gagal kompres foto:", error);
  }
};

  const handleRemovePhoto = (key) => {
    setDokumenFiles(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setRemovedFiles(prev => [...new Set([...prev, key])]);
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");

      // 1. DATA TEXT
      const fields = ["imei", "warna", "ram", "rom", "grade_type", "kunci_password", "kunci_pin", "kunci_pola"];
      fields.forEach(f => formData.append(f, data[f] || ""));
      formData.append("grade_nominal", Math.round(gradeNominal));

      // 2. KERUSAKAN & KELENGKAPAN
      kerusakanList.filter(i => i.checked).forEach((i, idx) => {
        formData.append(`kerusakan[${idx}][id]`, i.id);
        formData.append(`kerusakan[${idx}][nominal_override]`, Math.round(i.nominal_override));
      });
      kelengkapanList.filter(i => i.checked).forEach((i, idx) => {
        formData.append(`kelengkapan[${idx}][id]`, i.id);
      });

      // 3. FOTO DOKUMEN (Prefix file_)
Object.entries(dokumenFiles).forEach(([key, file]) => {
  console.log(`Menambahkan ke FormData: file_${key}`, file); // Cek di console log HP/Laptop
  if (file instanceof File) formData.append(`file_${key}`, file);
});

      // 4. SIGNAL HAPUS FILE (Agar Backend bersihkan Minio)
      removedFiles.forEach(key => formData.append("remove_files[]", key));

      const response = await axiosInstance.post(`${prefix}/gadai-hp/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        alert("✅ Data & Foto Berhasil Diperbarui!");
        navigate(-1);
      }
    } catch (err) {
      alert("Gagal: " + (err.response?.data?.message || "Server Error"));
    } finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2, mb: 10, px: 2 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3, borderLeft: '6px solid #1976d2' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item><IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton></Grid>
          <Grid item xs>
            <Typography variant="h6" fontWeight={800}>{data.detail_gadai?.no_gadai}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="caption" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Person fontSize="inherit" /> {data.detail_gadai?.nasabah?.nama_lengkap}</Typography>
              <Chip label={data.detail_gadai?.status?.toUpperCase()} size="small" color="success" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
            </Stack>
          </Grid>
          <Grid item><Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={saving}>{saving ? "SAVING..." : "SIMPAN"}</Button></Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}><ReceiptLong fontSize="small" /> Detail Unit</Typography>
            <Stack spacing={2}>
              <TextField label="Merk" size="small" fullWidth disabled value={data.merk?.nama_merk || ""} />
              <TextField label="Type" size="small" fullWidth disabled value={data.type_hp?.nama_type || ""} />
              <TextField label="IMEI" size="small" fullWidth value={data.imei || ""} onChange={(e) => setData({ ...data, imei: e.target.value })} />
              <TextField label="Warna" size="small" fullWidth value={data.warna || ""} onChange={(e) => setData({ ...data, warna: e.target.value })} />
              <Stack direction="row" spacing={1}>
                <TextField label="RAM" size="small" fullWidth value={data.ram || ""} onChange={(e) => setData({ ...data, ram: e.target.value })} />
                <TextField label="ROM" size="small" fullWidth value={data.rom || ""} onChange={(e) => setData({ ...data, rom: e.target.value })} />
              </Stack>
              <Divider sx={{ my: 1 }}><Typography variant="caption" fontWeight={700}>KEAMANAN</Typography></Divider>
              <Grid container spacing={1}>
                {['password', 'pin', 'pola'].map(k => (
                  <Grid item xs={4} key={k}><TextField label={k.toUpperCase()} size="small" fullWidth value={data[`kunci_${k}`] || ""} onChange={(e) => setData({ ...data, [`kunci_${k}`]: e.target.value })} /></Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 1 }}>Grade</Divider>
              <Select size="small" fullWidth value={data.grade_type || ""} onChange={(e) => { const g = grades.find(x => x.value === e.target.value); setData({ ...data, grade_type: e.target.value }); if (g) setGradeNominal(g.nominal); }}>
                {grades.map(g => <MenuItem key={g.value} value={g.value}>{g.label} - Rp {Number(g.nominal).toLocaleString()}</MenuItem>)}
              </Select>
              <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2, border: '1px dashed #1976d2', textAlign: 'right' }}>
                <Typography variant="caption" display="block">Pinjaman Bersih</Typography>
                <Typography variant="h6" fontWeight={800} color="primary">Rp {Math.round(finalTaksiran).toLocaleString()}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography fontWeight={800} color="error" mb={2}>Kerusakan</Typography>
            <Grid container spacing={1}>
              {kerusakanList.map((item, idx) => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: item.checked ? '#fff5f5' : '#fff', p: 1, borderRadius: 2, border: '1px solid #eee' }}>
                    <Checkbox size="small" checked={item.checked} color="error" onChange={(e) => { const copy = [...kerusakanList]; copy[idx].checked = e.target.checked; setKerusakanList(copy); }} />
                    <Typography flexGrow={1} variant="caption" fontWeight={600}>{item.nama}</Typography>
                    <Typography variant="caption" color="error">-{Math.round(item.nominal_override).toLocaleString()}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography fontWeight={800} color="success.main" mb={2} display="flex" alignItems="center" gap={1}><CheckBoxIcon fontSize="small" /> Kelengkapan</Typography>
            <Grid container spacing={1}>
              {kelengkapanList.map((item, idx) => (
                <Grid item xs={12} sm={4} key={item.id}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: item.checked ? '#f1f8e9' : '#fff', p: 1, borderRadius: 2, border: '1px solid #eee' }}>
                    <Checkbox size="small" checked={item.checked} color="success" onChange={(e) => { const copy = [...kelengkapanList]; copy[idx].checked = e.target.checked; setKelengkapanList(copy); }} />
                    <Typography flexGrow={1} variant="caption" fontWeight={600}>{item.nama}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight={800} mb={2}>Foto SOP</Typography>
            <Grid container spacing={2}>
              {(DOKUMEN_SOP_HP[data.merk?.nama_merk] || DOKUMEN_SOP_HP['Android']).map((key) => {
                const isRemoved = removedFiles.includes(key);
                const fileBaru = dokumenFiles[key];
                const previewUrlLocal = isRemoved ? null : (fileBaru ? URL.createObjectURL(fileBaru) : baseStorageUrl(data.dokumen_pendukung?.[key]));

                return (
                  <Grid item xs={6} sm={4} key={key}>
                    <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', borderRadius: 2, position: 'relative', bgcolor: isRemoved ? '#fafafa' : '#fff' }}>
                      {previewUrlLocal && (
                        <IconButton size="small" onClick={() => handleRemovePhoto(key)} sx={{ position: 'absolute', top: 0, right: 0, color: 'error.main' }}><DeleteForever fontSize="small" /></IconButton>
                      )}
                      <Typography variant="caption" fontWeight={700} display="block" mb={1}>{key.toUpperCase()}</Typography>
                      <Box sx={{ height: 90, bgcolor: '#f0f0f0', mb: 1, borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }} onClick={() => { if (previewUrlLocal) { setPreviewUrl(previewUrlLocal); setOpenPreview(true); } }}>
                        {previewUrlLocal ? <img src={previewUrlLocal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={key} /> : <Typography sx={{ fontSize: 10, mt: 4, color: '#999' }}>{isRemoved ? "DIBUANG" : "KOSONG"}</Typography>}
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <Button fullWidth variant="contained" size="small" component="label" sx={{ minWidth: 0 }}><PhotoCamera fontSize="small" /><input type="file" hidden accept="image/*" capture="environment" onChange={(e) => { handleFileChange(key, e.target.files[0]); e.target.value = null; }} /></Button>
                        <Button fullWidth variant="outlined" size="small" component="label" sx={{ minWidth: 0 }}><Folder fontSize="small" /><input type="file" hidden accept="image/*" onChange={(e) => { handleFileChange(key, e.target.files[0]); e.target.value = null; }} /></Button>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: 'black', textAlign: 'center', position: 'relative' }}>
          <IconButton onClick={() => setOpenPreview(false)} sx={{ position: 'absolute', right: 10, top: 10, color: 'white' }}><Close /></IconButton>
          <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: '85vh' }} alt="preview" />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EditGadaiHpPage;