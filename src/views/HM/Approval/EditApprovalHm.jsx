import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Grid, TextField, Button, Stack, CircularProgress,
  Card, CardContent, CardHeader, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import dayjs from "dayjs";

const EditApprovalHMPage = () => {
  const { detailGadaiId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ open: false, message: "", type: "success" });
  const [form, setForm] = useState({
    detail_gadai: {},
    perpanjangan_tempos: [],
    status: "",
    catatan: "",
  });

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/approvals/${detailGadaiId}/full-detail`);
        if (res.data.success) {
          const detail = res.data.data.detail_gadai;

          const jatuhTempoDefault = dayjs(detail.tanggal_gadai).add(15, "day").format("YYYY-MM-DD");

          setForm({
            detail_gadai: {
              uang_pinjaman: detail.uang_pinjaman ?? "",
              taksiran: detail.taksiran ?? "",
              tanggal_gadai: detail.tanggal_gadai ?? "",
              jatuh_tempo: detail.jatuh_tempo ?? jatuhTempoDefault,
            },
            perpanjangan_tempos: detail.perpanjangan_tempos?.map(p => ({
              id: p.id,
              tanggal_perpanjangan: p.tanggal_perpanjangan ?? "",
              jatuh_tempo_baru: p.jatuh_tempo_baru ?? dayjs(p.tanggal_perpanjangan).add(15, "day").format("YYYY-MM-DD"),
            })) || [],
            status: detail.status_hm ?? "",
            catatan: "",
          });
        } else {
          setNotif({ open: true, message: res.data.message, type: "error" });
        }
      } catch (err) {
        console.error(err);
        setNotif({ open: true, message: "Gagal memuat data", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [detailGadaiId]);

  const handleChangeDetail = (key, value) => {
    setForm(prev => ({ ...prev, detail_gadai: { ...prev.detail_gadai, [key]: value } }));
  };

  const handleChangePerpanjangan = (idx, key, value) => {
    const updated = [...form.perpanjangan_tempos];
    updated[idx][key] = value;
    setForm(prev => ({ ...prev, perpanjangan_tempos: updated }));
  };

  const handleChangeStatus = (value) => setForm(prev => ({ ...prev, status: value }));
  const handleChangeCatatan = (value) => setForm(prev => ({ ...prev, catatan: value }));

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      Object.entries(form.detail_gadai).forEach(([key, val]) => {
        formData.append(`detail_gadai[${key}]`, val ?? "");
      });

      form.perpanjangan_tempos.forEach((p, idx) => {
        formData.append(`perpanjangan_tempos[${idx}][id]`, p.id);
        formData.append(`perpanjangan_tempos[${idx}][jatuh_tempo_baru]`, p.jatuh_tempo_baru ?? "");
      });

      formData.append("status", form.status);
      formData.append("catatan", form.catatan ?? "");

      const res = await axiosInstance.post(`/approvals/${detailGadaiId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setNotif({ open: true, message: "Data berhasil disimpan", type: "success" });
        setTimeout(() => navigate(-1), 1000);
      } else {
        setNotif({ open: true, message: res.data.message, type: "warning" });
      }
    } catch (err) {
      console.error(err);
      setNotif({ open: true, message: "Gagal menyimpan data", type: "error" });
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 3, mb: 6 }}>
      <Card>
        <CardHeader title="Edit Detail Approval HM" />
        <CardContent>
          {/* DETAIL GADAI */}
          <Typography variant="h6" fontWeight={600} mb={1}>Detail Gadai</Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tanggal Gadai"
                  value={form.detail_gadai.tanggal_gadai}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Uang Pinjaman"
                  value={form.detail_gadai.uang_pinjaman}
                  onChange={(e) => handleChangeDetail("uang_pinjaman", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Taksiran"
                  value={form.detail_gadai.taksiran}
                  onChange={(e) => handleChangeDetail("taksiran", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" disabled={!form.detail_gadai.tanggal_gadai}>
                  <InputLabel>Jatuh Tempo</InputLabel>
                  <Select
                    value={form.detail_gadai.jatuh_tempo}
                    label="Jatuh Tempo"
                    onChange={(e) => handleChangeDetail("jatuh_tempo", e.target.value)}
                  >
                    {[15, 30].map((tenor) => {
                      const d = dayjs(form.detail_gadai.tanggal_gadai).add(tenor, "day");
                      const iso = d.format("YYYY-MM-DD");
                      return (
                        <MenuItem key={tenor} value={iso}>
                          {tenor} Hari — {d.format("DD/MM/YYYY")}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* PERPANJANGAN TEMPO */}
          {form.perpanjangan_tempos.length > 0 && (
            <>
              <Typography variant="h6" fontWeight={600} mb={1}>Perpanjangan Tempo</Typography>
              {form.perpanjangan_tempos.map((p, idx) => (
                <Paper key={p.id} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        label="Tanggal Perpanjangan"
                        value={p.tanggal_perpanjangan}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Jatuh Tempo Baru</InputLabel>
                        <Select
                          value={p.jatuh_tempo_baru}
                          label="Jatuh Tempo Baru"
                          onChange={(e) => handleChangePerpanjangan(idx, "jatuh_tempo_baru", e.target.value)}
                        >
                          {[15, 30].map((tenor) => {
                            const d = dayjs(p.tanggal_perpanjangan).add(tenor, "day");
                            const iso = d.format("YYYY-MM-DD");
                            return (
                              <MenuItem key={tenor} value={iso}>
                                {tenor} Hari — {d.format("DD/MM/YYYY")}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </>
          )}

          {/* STATUS & CATATAN */}
          <Typography variant="h6" fontWeight={600} mb={1}>Status Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => handleChangeStatus(e.target.value)}
                >
                  <MenuItem value="approved_hm">Approved</MenuItem>
                  <MenuItem value="rejected_hm">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Catatan"
                value={form.catatan}
                onChange={(e) => handleChangeCatatan(e.target.value)}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="outlined" onClick={() => navigate(-1)}>Batal</Button>
            <Button variant="contained" onClick={handleSubmit}>Simpan</Button>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={notif.open}
        autoHideDuration={4000}
        onClose={() => setNotif(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={notif.type} variant="filled">{notif.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EditApprovalHMPage;
