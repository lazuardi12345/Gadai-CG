import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import logo from "assets/images/CGadai.png";

const PrintStrukPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(`/detail-gadai/${id}`);
        if (res.data?.success) setData(res.data.data);
        else setData(null);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (!data) return <p>Tidak ada data.</p>;

  const detail = data || {};
  const nasabah = detail?.nasabah || {};
  const petugas = nasabah?.user?.name || "-";
  const typeNama = detail?.type?.nama_type || "-";

  // ======================
  // 🔥 HITUNG BIAYA GADAI
  // ======================
  const pinjaman = Number(detail?.uang_pinjaman || 0);
  const tglGadai = new Date(detail?.tanggal_gadai);
  const tglJatuhTempo = new Date(detail?.jatuh_tempo);

  // === Hitung lama hari ===
  let selisihHari = Math.ceil((tglJatuhTempo - tglGadai) / (1000 * 60 * 60 * 24));

  // ✅ Tambahkan toleransi 1 hari
  const blokHari = [15, 30, 45, 60, 75, 90, 105, 120];
  for (let batas of blokHari) {
    if (selisihHari === batas + 1) {
      selisihHari = batas;
      break;
    }
  }

  let persenJasa = 0;
  let jenisSkema = "Non-HP";

  // === Jika barang HP ===
  if ((typeNama || "").toLowerCase() === "handphone") {
    jenisSkema = "HP";
    if (selisihHari <= 15) persenJasa = 0.045;
    else if (selisihHari <= 30) persenJasa = 0.095;
    else if (selisihHari <= 45) persenJasa = 0.145;
    else if (selisihHari <= 60) persenJasa = 0.195;
    else {
      const extraBlocks = Math.ceil((selisihHari - 60) / 15);
      persenJasa = 0.195 + extraBlocks * 0.05;
    }
  }
  // === Barang selain HP ===
  else {
    if (selisihHari <= 15) persenJasa = 0.015;
    else if (selisihHari <= 30) persenJasa = 0.025;
    else if (selisihHari <= 45) persenJasa = 0.04;
    else if (selisihHari <= 60) persenJasa = 0.05;
    else {
      const extraBlocks = Math.ceil((selisihHari - 60) / 15);
      persenJasa = 0.05 + extraBlocks * 0.01;
    }
  }

  const jasaSewa = pinjaman * persenJasa;
  const admin = pinjaman * 0.01; // 1%
  const asuransi = 10000;
  const totalDiterima = pinjaman - jasaSewa - admin - asuransi;

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  // ======================
  // 🔹 FORMAT TANGGAL
  // ======================
  const formatHariTanggal = (date) => {
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
  };
  const tanggalCetakStruk = formatHariTanggal(new Date());

  // ======================
  // 🔹 DETAIL BARANG
  // ======================
  let barangNama = "-";
  let barangDetail = "-";
  let labelBarangDetail = "-";

  switch ((typeNama || "").toLowerCase()) {
    case "handphone":
      if (detail.hp) {
        barangNama = detail.hp.nama_barang || "-";
        barangDetail = `${detail.hp.merk || "-"} / ${detail.hp.type_hp || "-"}`;
        labelBarangDetail = "Merk / Type";
      }
      break;
    case "perhiasan":
    case "logam mulia":
    case "retro":
      const item = detail.perhiasan || detail.logam_mulia || detail.retro;
      if (item) {
        barangNama = item.nama_barang || "-";
        barangDetail = `${item.karat || "-"} / ${item.berat || "-"}`;
        labelBarangDetail = "Karat / Berat";
      }
      break;
    default:
      if (detail.hp) {
        barangNama = detail.hp.nama_barang || "-";
        barangDetail = `${detail.hp.merk || "-"} / ${detail.hp.type_hp || "-"}`;
        labelBarangDetail = "Merk / Type";
      }
      break;
  }

  // ======================
  // 🔹 CETAK STRUK
  // ======================
  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Gadai</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: monospace; font-size: 11px; margin: 0; padding: 0; text-align: left; }
            .print-box { width: 80mm; margin: 0 auto; padding: 6px; }
            .center { text-align: center; }
            img { display: block; margin: 15 auto 9px auto; width: 150px; }
            hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .label { text-align: left; }
            .value { text-align: right; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="print-box">
            <div class="center">
              <img src="${logo}" alt="Logo" />
              <div>No Transaksi</div>
              <div class="bold">${detail?.no_gadai || "-"}</div>
            </div>

            <div class="row"><span class="label">Hari, Tanggal</span><span class="value">${tanggalCetakStruk}</span></div>
            <div class="row"><span class="label">Petugas</span><span class="value">${petugas}</span></div>

            <div class="center bold" style="margin: 6px 0;">TRANSAKSI GADAI</div>

            <div class="row"><span class="label">Harga Taksiran</span><span class="value">${formatRupiah(detail?.taksiran)}</span></div>
            <div class="row"><span class="label">Harga Pinjaman</span><span class="value">${formatRupiah(detail?.uang_pinjaman)}</span></div>
            <div class="row"><span class="label">Barang Gadai</span><span class="value">${typeNama}</span></div>
            <hr />

            <div class="row"><span class="label">Nama Barang</span><span class="value">${barangNama}</span></div>
            <div class="row"><span class="label">${labelBarangDetail}</span><span class="value">${barangDetail}</span></div>
            <hr />

            <div class="row"><span class="label">Pokok Pinjaman</span><span class="value">${formatRupiah(pinjaman)}</span></div>
            <div class="row"><span class="label">Jasa Sewa (${jenisSkema} ${(persenJasa * 100).toFixed(1)}%)</span><span class="value">${formatRupiah(jasaSewa)}</span></div>
            <div class="row"><span class="label">Administrasi</span><span class="value">${formatRupiah(admin)}</span></div>
            <div class="row"><span class="label">Asuransi</span><span class="value">${formatRupiah(asuransi)}</span></div>
            <div class="row bold"><span class="label">Total Diterima</span><span class="value">${formatRupiah(totalDiterima)}</span></div>
            <hr />

            <div class="row"><span class="label">Tanggal Gadai</span><span class="value">${detail?.tanggal_gadai || "-"}</span></div>
            <div class="row"><span class="label">Jatuh Tempo</span><span class="value">${detail?.jatuh_tempo || "-"}</span></div>
            <hr />

            <div class="center">
              <div>Terima kasih atas kepercayaan Anda!</div>
              <div>Gadai cepat, aman, dan terpercaya di</div>
              <div class="bold">CG GADAI.</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ maxWidth: 400, margin: "0 auto", padding: 2, textAlign: "center" }}>
      <div ref={printRef}>
        <img src={logo} alt="Logo" style={{ height: "100px", marginBottom: "6px" }} />
        <div>No Transaksi</div>
        <div style={{ fontWeight: "bold" }}>{detail?.no_gadai || "-"}</div>

        <div style={{ marginTop: "4px" }}>Hari, Tanggal {tanggalCetakStruk}</div>
        <div>Petugas {petugas}</div>
        <div style={{ marginTop: "6px", fontWeight: "bold" }}>TRANSAKSI GADAI</div>

        <div style={{ textAlign: "left", marginTop: "6px" }}>
          <div>Harga Taksiran {formatRupiah(detail?.taksiran)}</div>
          <div>Harga Pinjaman {formatRupiah(detail?.uang_pinjaman)}</div>
          <div>Barang Gadai {typeNama}</div>
          <hr />
          <div>Nama Barang: {barangNama}</div>
          <div>{labelBarangDetail}: {barangDetail}</div>
          <hr />
          <div>Pokok Pinjaman {formatRupiah(pinjaman)}</div>
          <div>Jasa Sewa ({jenisSkema} {(persenJasa * 100).toFixed(1)}%) {formatRupiah(jasaSewa)}</div>
          <div>Administrasi {formatRupiah(admin)}</div>
          <div>Asuransi {formatRupiah(asuransi)}</div>
          <div><b>Total Diterima {formatRupiah(totalDiterima)}</b></div>
          <div>Tanggal Gadai {detail?.tanggal_gadai || "-"}</div>
          <div>Jatuh Tempo {detail?.jatuh_tempo || "-"}</div>
        </div>

        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <p>Terima kasih atas kepercayaan Anda!</p>
          <p>Gadai cepat, aman, dan terpercaya di</p>
          <p><b>CG GADAI.</b></p>
        </div>
      </div>

      <Button variant="contained" color="primary" onClick={handlePrint} sx={{ mt: 2 }}>
        Cetak Struk
      </Button>
    </Box>
  );
};

export default PrintStrukPage;
