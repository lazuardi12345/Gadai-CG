import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const TambahPerpanjanganTempoPage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("auth_user"));
  const userRole = user?.role?.toLowerCase() || ""; // "hm", "checker", "petugas"

  const apiBaseUrl = userRole === "checker"
    ? "/checker/perpanjangan-tempo"
    : userRole === "petugas"
    ? "/petugas/perpanjangan-tempo"
    : "/perpanjangan-tempo";

  const detailGadaiUrl = userRole === "checker"
    ? "/checker/detail-gadai"
    : userRole === "petugas"
    ? "/petugas/detail-gadai"
    : "/detail-gadai";

  const [form, setForm] = useState({
    detail_gadai_id: "",
    tanggal_perpanjangan: "",
    jatuh_tempo_baru: "",
  });

  const [detailGadai, setDetailGadai] = useState([]);
  const [uniqueNasabah, setUniqueNasabah] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch data detail gadai sesuai role
  useEffect(() => {
    const fetchDetailGadai = async () => {
      try {
        const res = await axiosInstance.get(detailGadaiUrl);
        const data = res.data.data || [];
        setDetailGadai(data);

        // Ambil nasabah unik
        const nasabahMap = {};
        data.forEach((d) => {
          if (d.nasabah && !nasabahMap[d.nasabah.id]) {
            nasabahMap[d.nasabah.id] = d.nasabah;
          }
        });
        setUniqueNasabah(Object.values(nasabahMap));
      } catch (err) {
        alert("Gagal memuat data detail gadai");
      } finally {
        setLoading(false);
      }
    };

    fetchDetailGadai();
  }, [detailGadaiUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    for (let key in form) {
      if (!form[key]) {
        alert("Semua field harus diisi!");
        return;
      }
    }

    try {
      setSaving(true);
      const res = await axiosInstance.post(apiBaseUrl, form);
      if (res.data.success) {
        alert("Perpanjangan berhasil ditambahkan");
        navigate('/perpanjangan-tempo');
      } else {
        alert(res.data.message || "Gagal menambahkan perpanjangan");
      }
    } catch (err) {
      alert(err.message || "Terjadi kesalahan server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  }

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Tambah Perpanjangan Tempo" />
      <CardContent>
        <Grid container spacing={2}>
          {/* Pilih Nasabah */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={uniqueNasabah}
              getOptionLabel={(option) => option.nama_lengkap || ""}
              value={
                uniqueNasabah.find(
                  (n) =>
                    detailGadai.find((d) => d.id === form.detail_gadai_id)?.nasabah?.id ===
                    n.id
                ) || null
              }
              onChange={(event, newValue) => {
                const detail = detailGadai.find((d) => d.nasabah?.id === newValue?.id);
                setForm((prev) => ({
                  ...prev,
                  detail_gadai_id: detail ? detail.id : "",
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nama Nasabah"
                  placeholder="Cari nama nasabah..."
                  size="small"
                  fullWidth
                />
              )}
            />
          </Grid>

          {/* Tanggal Perpanjangan */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tanggal Perpanjangan"
              name="tanggal_perpanjangan"
              type="date"
              value={form.tanggal_perpanjangan}
              onChange={handleChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Jatuh Tempo Baru */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={!form.tanggal_perpanjangan}>
              <InputLabel>Jatuh Tempo Baru</InputLabel>
              <Select
                name="jatuh_tempo_baru"
                value={form.jatuh_tempo_baru || ""}
                label="Jatuh Tempo Baru"
                onChange={handleChange}
              >
                {form.tanggal_perpanjangan &&
                  [15, 30].map((days) => {
                    const d = new Date(form.tanggal_perpanjangan);
                    d.setDate(d.getDate() + days);
                    return (
                      <MenuItem key={days} value={d.toISOString().split("T")[0]}>
                        {days} Hari — {d.toLocaleDateString("id-ID")}
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/perpanjangan-tempo')}>
            Batal
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TambahPerpanjanganTempoPage;
