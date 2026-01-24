import React, { useEffect, useState, useContext } from "react";
import {
  Box, Grid, Typography, Stack, Button, CircularProgress, Paper,
  TextField, Checkbox, Divider, Select, MenuItem, Dialog, DialogContent, IconButton
} from "@mui/material";
import { ArrowBack, Close, OpenInNew } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian'],
};

const baseStorageUrl = (path) => 
  path ? (path.startsWith("http") ? path : `http://192.182.6.107:8000/storage/${path}`) : null;

const EditGadaiHpPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

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
  const [openPreview, setOpenPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchData = async () => {
    if (!userRole) return;
    setLoading(true);
    try {
      let baseUrl = userRole === "checker" ? "/checker/gadai-hp" : "/gadai-hp";
      const res = await axiosInstance.get(`${baseUrl}/${id}`);
      const raw = res.data.data;
      
      setData(raw);
      let initialGradeNominal = 0;
      if (raw.grade && raw.grade_type) {
        const key = `grade_${raw.grade_type}`;
        initialGradeNominal = Number(raw.grade[key]) || Number(raw.grade_nominal) || 0;
      }
      setGradeNominal(initialGradeNominal);

      if (raw.grade) {
        setGrades([
          { value: "a_dus", label: "Grade A (Dus)", nominal: raw.grade.grade_a_dus },
          { value: "a_tanpa_dus", label: "Grade A (Tanpa Dus)", nominal: raw.grade.grade_a_tanpa_dus },
          { value: "b_dus", label: "Grade B (Dus)", nominal: raw.grade.grade_b_dus },
          { value: "b_tanpa_dus", label: "Grade B (Tanpa Dus)", nominal: raw.grade.grade_b_tanpa_dus },
          { value: "c_dus", label: "Grade C (Dus)", nominal: raw.grade.grade_c_dus },
          { value: "c_tanpa_dus", label: "Grade C (Tanpa Dus)", nominal: raw.grade.grade_c_tanpa_dus },
        ]);
      }

      const [kerRes, kelRes] = await Promise.all([
        axiosInstance.get("/kerusakan"),
        axiosInstance.get("/kelengkapan")
      ]);

      const kerMaster = kerRes.data.data.items || [];
      setKerusakanList(kerMaster.map((m) => {
        const exist = raw.kerusakan_list?.find((r) => r.id === m.id);
        return {
          id: m.id,
          nama: m.nama_kerusakan,
          nominal_override: exist ? (exist.pivot?.nominal_override ?? m.nominal) : m.nominal,
          checked: !!exist,
        };
      }));

      const kelMaster = kelRes.data.data.items || [];
      setKelengkapanList(kelMaster.map((m) => {
        const exist = raw.kelengkapan_list?.find((r) => r.id === m.id);
        return {
          id: m.id,
          nama: m.nama_kelengkapan,
          nominal_override: exist ? (exist.pivot?.nominal_override ?? m.nominal) : m.nominal,
          checked: !!exist,
        };
      }));

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal memuat data");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, userRole]);

  useEffect(() => {
    const potongan = kerusakanList.filter(x => x.checked).reduce((s, i) => s + (Number(i.nominal_override) || 0), 0);
    const plus = kelengkapanList.filter(x => x.checked).reduce((s, i) => s + (Number(i.nominal_override) || 0), 0);
    setTotalPotonganKerusakan(potongan);
    setTotalKelengkapan(plus);
  }, [kerusakanList, kelengkapanList]);

  const finalTaksiran = gradeNominal - totalPotonganKerusakan + totalKelengkapan;

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    
    try {
      const baseUrl = userRole === "checker" ? "/checker/gadai-hp" : "/gadai-hp";
      const formData = new FormData();
      formData.append("_method", "PUT");
      const uangPinjaman = Math.round(Number(finalTaksiran) || 0);
      const taksiranDatabase = Number(data.detail_gadai?.taksiran) || (uangPinjaman * 1.1);
      const sendTaksiran = Math.round(taksiranDatabase);

      formData.append("grade_nominal", Number(gradeNominal) || 0);
      formData.append("taksiran", sendTaksiran); 
      formData.append("uang_pinjaman", uangPinjaman);
      
      formData.append("grade_hp_id", data.grade_hp_id || "");
      formData.append("grade_type", data.grade_type || "");

      kerusakanList.filter(i => i.checked).forEach((i, idx) => {
        formData.append(`kerusakan[${idx}][id]`, i.id);
        formData.append(`kerusakan[${idx}][nominal_override]`, Number(i.nominal_override) || 0);
      });

      kelengkapanList.filter(i => i.checked).forEach((i, idx) => {
        formData.append(`kelengkapan[${idx}][id]`, i.id);
        formData.append(`kelengkapan[${idx}][nominal_override]`, Number(i.nominal_override) || 0);
      });

      Object.entries(dokumenFiles).forEach(([key, file]) => {
        if (file instanceof File) formData.append(key, file);
      });

      ["imei", "warna", "kunci_password", "kunci_pin", "kunci_pola", "ram", "rom"].forEach((key) => {
        formData.append(key, data[key] || "");
      });

      await axiosInstance.post(`${baseUrl}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Berhasil memperbarui data gadai!");
      navigate(-1);
    } catch (err) {
      console.error("Error Detail:", err.response?.data);
      alert(err.response?.data?.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const sopKeys = () => {
    const nama = data.nama_barang;
    const merk = data.merk?.nama_merk;
    const typeHp = data.type_hp?.nama_type;
    return Array.from(new Set([
      ...(DOKUMEN_SOP_HP[nama] || []),
      ...(DOKUMEN_SOP_HP[merk] || []),
      ...(DOKUMEN_SOP_HP[typeHp] || []),
    ]));
  };

  if (loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: "70vh" }}>
      <CircularProgress />
    </Stack>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, mb: 8, px: 2 }}>
      <Paper elevation={2} sx={{ position: "sticky", top: 16, zIndex: 20, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
            <Box>
              <Typography variant="h6" fontWeight={700}>Edit Gadai HP</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.merk?.nama_merk} • {data.type_hp?.nama_type}
              </Typography>
            </Box>
          </Stack>
          {data.detail_gadai?.status === 'lunas' && (
            <Typography variant="overline" sx={{ bgcolor: 'success.main', color: 'white', px: 2, borderRadius: 1 }}>LUNAS</Typography>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Typography fontWeight={700} textAlign="center" variant="h6">Data Barang</Typography>
              <Divider />
              <Stack spacing={1}>
                <Row label="Merk" value={data.merk?.nama_merk} />
                <Row label="Type" value={data.type_hp?.nama_type} />
                <TextField label="IMEI" fullWidth size="small" value={data.imei || ""} onChange={(e) => setData({ ...data, imei: e.target.value })} />
                <TextField label="Warna" fullWidth size="small" value={data.warna || ""} onChange={(e) => setData({ ...data, warna: e.target.value })} />
                <Stack direction="row" spacing={1}>
                    <TextField label="RAM" size="small" fullWidth value={data.ram || ""} onChange={(e) => setData({ ...data, ram: e.target.value })} />
                    <TextField label="ROM" size="small" fullWidth value={data.rom || ""} onChange={(e) => setData({ ...data, rom: e.target.value })} />
                </Stack>
                <TextField label="Kunci Password" fullWidth size="small" value={data.kunci_password || ""} onChange={(e) => setData({ ...data, kunci_password: e.target.value })} />
                <TextField label="Kunci PIN" fullWidth size="small" value={data.kunci_pin || ""} onChange={(e) => setData({ ...data, kunci_pin: e.target.value })} />
                <TextField label="Kunci Pola" fullWidth size="small" value={data.kunci_pola || ""} onChange={(e) => setData({ ...data, kunci_pola: e.target.value })} />

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Grade HP</Typography>
                <Select
                  value={data.grade_type || ""}
                  fullWidth
                  size="small"
                  onChange={(e) => {
                    const g = grades.find(x => x.value === e.target.value);
                    if (g) {
                      setData((p) => ({ ...p, grade_type: e.target.value }));
                      setGradeNominal(g.nominal);
                    }
                  }}
                >
                  {grades.map(g => (
                    <MenuItem key={g.value} value={g.value}>
                      {g.label} — Rp {g.nominal?.toLocaleString()}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight={800} mb={1}>Kerusakan</Typography>
            <Grid container spacing={1} mb={2}>
              {kerusakanList.map((item, idx) => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Checkbox checked={item.checked} onChange={(e) => {
                      const copy = [...kerusakanList];
                      copy[idx].checked = e.target.checked;
                      setKerusakanList(copy);
                    }} />
                    <Typography sx={{ flexGrow: 1, fontSize: 14 }}>{item.nama}</Typography>
                    <TextField size="small" type="number" sx={{ width: 110 }} value={item.nominal_override} onChange={(e) => {
                        const copy = [...kerusakanList];
                        copy[idx].nominal_override = e.target.value;
                        setKerusakanList(copy);
                    }} />
                  </Stack>
                </Grid>
              ))}
            </Grid>

            <Typography fontWeight={800} mt={2} mb={1}>Kelengkapan</Typography>
            <Grid container spacing={1} mb={2}>
              {kelengkapanList.map((item, idx) => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Checkbox checked={item.checked} onChange={(e) => {
                      const copy = [...kelengkapanList];
                      copy[idx].checked = e.target.checked;
                      setKelengkapanList(copy);
                    }} />
                    <Typography sx={{ flexGrow: 1, fontSize: 14 }}>{item.nama}</Typography>
                    <TextField size="small" type="number" sx={{ width: 110 }} value={item.nominal_override} onChange={(e) => {
                        const copy = [...kelengkapanList];
                        copy[idx].nominal_override = e.target.value;
                        setKelengkapanList(copy);
                    }} />
                  </Stack>
                </Grid>
              ))}
            </Grid>

            <Typography fontWeight={800} mt={2} mb={1}>Dokumen Pendukung</Typography>
            <Grid container spacing={2}>
              {sopKeys().map((key) => {
                const path = data.dokumen_pendukung?.[key];
                const uploadedFile = dokumenFiles[key];
                const url = uploadedFile ? URL.createObjectURL(uploadedFile) : (path ? baseStorageUrl(path) : null);
                return (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Paper elevation={3} sx={{ p: 1, borderRadius: 2, textAlign: "center" }}>
                      <Typography variant="caption" fontWeight={700}>{key.toUpperCase()}</Typography>
                      <Box sx={{ mt: 1 }}>
                        {url ? (
                          <img src={url} alt={key} style={{ width: "100%", borderRadius: 4, height: 100, objectFit: "cover", cursor: "pointer" }} onClick={() => { setPreviewUrl(url); setOpenPreview(true); }} />
                        ) : (
                          <Box sx={{ height: 100, border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "gray" }}>No Image</Box>
                        )}
                      </Box>
                      <Button variant="text" size="small" fullWidth component="label" sx={{ mt: 0.5 }}>
                        Upload
                        <input type="file" hidden accept="image/*" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setDokumenFiles(p => ({ ...p, [key]: f }));
                        }} />
                      </Button>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>

            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md">
              <DialogContent sx={{ p: 0, position: "relative" }}>
                {previewUrl && (
                  <>
                    <IconButton onClick={() => window.open(previewUrl, "_blank")} sx={{ position: "absolute", right: 48, top: 8, color: "white", bgcolor: "rgba(0,0,0,0.5)" }}><OpenInNew /></IconButton>
                    <IconButton onClick={() => setOpenPreview(false)} sx={{ position: "absolute", right: 8, top: 8, color: "white", bgcolor: "rgba(0,0,0,0.5)" }}><Close /></IconButton>
                    <img src={previewUrl} alt="Preview" style={{ width: "100%", display: "block" }} />
                  </>
                )}
              </DialogContent>
            </Dialog>

            <Divider sx={{ my: 3 }} />
            <Stack spacing={0.5}>
                <Typography variant="body2">Grade Dasar: Rp {gradeNominal.toLocaleString()}</Typography>
                <Typography variant="body2" color="error">Total Potongan: - Rp {totalPotonganKerusakan.toLocaleString()}</Typography>
                <Typography variant="body2" color="success.main">Total Tambahan: + Rp {totalKelengkapan.toLocaleString()}</Typography>
                <Typography fontWeight={800} fontSize={24} color="primary" sx={{ mt: 1 }}>Pinjaman: Rp {finalTaksiran.toLocaleString()}</Typography>
            </Stack>

            <Button fullWidth variant="contained" size="large" sx={{ mt: 3, py: 1.5, borderRadius: 2 }} disabled={saving} onClick={handleSubmit}>
              {saving ? "Proses..." : "Update Data Gadai"}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const Row = ({ label, value, bold }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="caption" fontWeight={bold ? 700 : 600}>{value || "-"}</Typography>
  </Box>
);

export default EditGadaiHpPage;