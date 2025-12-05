import React, { useEffect, useState } from "react";
import {
  Box, Grid, Typography, Stack, Button, CircularProgress, Paper,
  TextField, Checkbox, Divider, Select, MenuItem, Tooltip
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowBack, Image } from "@mui/icons-material";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import { Close, OpenInNew } from "@mui/icons-material";

// SOP Dokumen
const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian'],
};

const baseStorageUrl = (path) => path ? (path.startsWith("http") ? path : `http://192.182.6.107:8000/storage/${path}`) : null;

const EditGadaiHpPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // Fetch data HP, kerusakan, kelengkapan
  const fetchData = async () => {
    try {
      const res = await axiosInstance.get(`/gadai-hp/${id}`);
      const raw = res.data.data;
      setData(raw);
      setGradeNominal(raw.grade_nominal ?? 0);

      if (raw.grade) {
        setGrades([
          { label: "A", nominal: raw.grade.harga_grade_a, id: raw.grade.id },
          { label: "B", nominal: raw.grade.harga_grade_b, id: raw.grade.id },
          { label: "C", nominal: raw.grade.harga_grade_c, id: raw.grade.id },
        ]);
      }

      const kerRes = await axiosInstance.get("/kerusakan");
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

      const kelRes = await axiosInstance.get("/kelengkapan");
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

      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data");
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    const potongan = kerusakanList.filter(x => x.checked).reduce((s, i) => s + Number(i.nominal_override), 0);
    const plus = kelengkapanList.filter(x => x.checked).reduce((s, i) => s + Number(i.nominal_override), 0);
    setTotalPotonganKerusakan(potongan);
    setTotalKelengkapan(plus);
  }, [kerusakanList, kelengkapanList]);

  const finalTaksiran = gradeNominal - totalPotonganKerusakan + totalKelengkapan;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("grade_nominal", gradeNominal);
      formData.append("grade_hp_id", data.grade_hp_id);
      formData.append("grade_type", data.grade_type);

      // Kerusakan
      kerusakanList.filter(i => i.checked).forEach((i, idx) => {
        formData.append(`kerusakan[${idx}][id]`, i.id);
        formData.append(`kerusakan[${idx}][nominal_override]`, i.nominal_override);
      });

      // Kelengkapan
      kelengkapanList.filter(i => i.checked).forEach((i, idx) => {
        formData.append(`kelengkapan[${idx}][id]`, i.id);
        formData.append(`kelengkapan[${idx}][nominal_override]`, i.nominal_override);
      });

      // Dokumen
      Object.entries(dokumenFiles).forEach(([key, file]) => {
        if (file instanceof File) formData.append(key, file);
      });

      // Editable fields
      ["imei", "warna", "kunci_password", "kunci_pin", "kunci_pola", "ram", "rom"].forEach((key) => {
        if (data[key] !== undefined) formData.append(key, data[key]);
      });

      await axiosInstance.post(`/gadai-hp/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Berhasil update");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan");
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
            <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="text">Kembali</Button>
            <Box>
              <Typography variant="h6" fontWeight={700}>Edit Gadai HP</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.merk?.nama_merk} • {data.type_hp?.nama_type}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>

        {/* LEFT SUMMARY */}
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
                <TextField label="RAM" size="small" sx={{ width: '48%', mr: 1 }} value={data.ram || ""} onChange={(e) => setData({ ...data, ram: e.target.value })} />
                <TextField label="ROM" size="small" sx={{ width: '48%' }} value={data.rom || ""} onChange={(e) => setData({ ...data, rom: e.target.value })} />
                <TextField label="Kunci Password" fullWidth size="small" value={data.kunci_password || ""} onChange={(e) => setData({ ...data, kunci_password: e.target.value })} />
                <TextField label="Kunci PIN" fullWidth size="small" value={data.kunci_pin || ""} onChange={(e) => setData({ ...data, kunci_pin: e.target.value })} />
                <TextField label="Kunci Pola" fullWidth size="small" value={data.kunci_pola || ""} onChange={(e) => setData({ ...data, kunci_pola: e.target.value })} />

                {/* GRADE SELECT */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Grade</Typography>
                <Select
                  value={data.grade_type || ""}
                  fullWidth
                  size="small"
                  onChange={(e) => {
                    const g = grades.find(x => x.label === e.target.value);
                    if (g) {
                      setData((p) => ({ ...p, grade_type: e.target.value }));
                      setGradeNominal(g.nominal);
                    }
                  }}
                >
                  {grades.map(g => (
                    <MenuItem key={g.label} value={g.label}>
                      Grade {g.label} — Rp {g.nominal?.toLocaleString()}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT MAIN */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>

            {/* KERUSAKAN */}
            <Typography fontWeight={800} mb={1}>Kerusakan</Typography>
            <Grid container spacing={1}>
              {kerusakanList.map((item, idx) => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Checkbox
                      checked={item.checked}
                      onChange={(e) => {
                        const copy = [...kerusakanList];
                        copy[idx].checked = e.target.checked;
                        setKerusakanList(copy);
                      }}
                    />
                    <Typography sx={{ minWidth: 120 }}>{item.nama}</Typography>
                    <TextField
                      size="small"
                      type="number"
                      sx={{ width: 100 }}
                      value={item.nominal_override}
                      onChange={(e) => {
                        const copy = [...kerusakanList];
                        copy[idx].nominal_override = e.target.value;
                        setKerusakanList(copy);
                      }}
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>

            {/* KELENGKAPAN */}
            <Typography fontWeight={800} mt={2} mb={1}>Kelengkapan</Typography>
            <Grid container spacing={1}>
              {kelengkapanList.map((item, idx) => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Checkbox
                      checked={item.checked}
                      onChange={(e) => {
                        const copy = [...kelengkapanList];
                        copy[idx].checked = e.target.checked;
                        setKelengkapanList(copy);
                      }}
                    />
                    <Typography sx={{ minWidth: 120 }}>{item.nama}</Typography>
                    <TextField
                      size="small"
                      type="number"
                      sx={{ width: 100 }}
                      value={item.nominal_override}
                      onChange={(e) => {
                        const copy = [...kelengkapanList];
                        copy[idx].nominal_override = e.target.value;
                        setKelengkapanList(copy);
                      }}
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>

            {/* DOKUMEN PENDUKUNG MODERN */}
            <Typography fontWeight={800} mt={2} mb={1}>Dokumen Pendukung</Typography>
            <Grid container spacing={2}>
              {sopKeys().map((key) => {
                const path = data.dokumen_pendukung?.[key];
                const uploadedFile = dokumenFiles[key];
                const url = uploadedFile ? URL.createObjectURL(uploadedFile) : (path ? baseStorageUrl(path) : null);

                return (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        textAlign: "center",
                        position: "relative",
                        cursor: url ? "pointer" : "default",
                        '&:hover .overlay': { opacity: 1 },
                        transition: "all 0.2s"
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{key.toUpperCase()}</Typography>

                      <Box sx={{ position: "relative" }}>
                        {url ? (
                          <>
                            <img
                              src={url}
                              alt={key}
                              style={{ width: "100%", borderRadius: 8, objectFit: "cover", maxHeight: 120 }}
                              onClick={() => { setPreviewUrl(url); setOpenPreview(true); }}
                            />
                            <Box
                              className="overlay"
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                bgcolor: "rgba(0,0,0,0.3)",
                                borderRadius: 2,
                                opacity: 0,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                transition: "opacity 0.2s"
                              }}
                            >
                              <IconButton
                                size="small"
                                sx={{ bgcolor: "error.main", color: "white", '&:hover': { bgcolor: "error.dark" } }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDokumenFiles(p => {
                                    const copy = { ...p };
                                    delete copy[key];
                                    return copy;
                                  });
                                }}
                              >
                                &times;
                              </IconButton>
                            </Box>
                          </>
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: 120,
                              borderRadius: 2,
                              border: "2px dashed #ccc",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: "#888",
                              fontSize: 14
                            }}
                          >
                            Belum ada file
                          </Box>
                        )}
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ mt: 1 }}
                        component="label"
                      >
                        {url ? "Ganti File" : "Upload File"}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setDokumenFiles(p => ({ ...p, [key]: f }));
                          }}
                        />
                      </Button>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>



            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md">
              <DialogContent sx={{ p: 0, position: "relative" }}>
                {/* Tombol Buka di Tab Baru */}
                {previewUrl && (
                  <IconButton
                    onClick={() => window.open(previewUrl, "_blank")}
                    sx={{ position: "absolute", right: 48, top: 8, zIndex: 10, color: "black" }}
                    title="Buka di Tab Baru"
                  >
                    <OpenInNew />
                  </IconButton>
                )}

                {/* Tombol Close */}
                <IconButton
                  onClick={() => setOpenPreview(false)}
                  sx={{ position: "absolute", right: 8, top: 8, zIndex: 10, color: "black" }}
                  title="Tutup"
                >
                  <Close />
                </IconButton>

                {/* Gambar */}
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                )}
              </DialogContent>
            </Dialog>


            {/* SUMMARY */}
            <Divider sx={{ my: 3 }} />
            <Typography>Total Grade: Rp {gradeNominal.toLocaleString()}</Typography>
            <Typography>Total Potongan Kerusakan: Rp {totalPotonganKerusakan.toLocaleString()}</Typography>
            <Typography>Total Kelengkapan: Rp {totalKelengkapan.toLocaleString()}</Typography>
            <Typography fontWeight={800} fontSize={20} mt={1}>Uang Pinjaman: Rp {finalTaksiran.toLocaleString()}</Typography>

            {/* SUBMIT */}
            <Button fullWidth variant="contained" sx={{ mt: 3 }} disabled={saving} onClick={handleSubmit}>
              {saving ? "Saving..." : "Simpan Perubahan"}
            </Button>

          </Paper>
        </Grid>


      </Grid>
    </Box>
  );
};

const Row = ({ label, value, bold }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
    <Typography variant="subtitle2" fontWeight={bold ? 700 : 500}>{value || "-"}</Typography>
  </Box>
);

export default EditGadaiHpPage;
