import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box, Paper } from "@mui/material"; // Tambah Paper biar gak error
import logo from "assets/images/LogoBaru1.png";
import { AuthContext } from "AuthContex/AuthContext";

const PrintStrukPerpanjanganPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  const getApiUrl = () => {
    switch (userRole) {
      case "petugas": return `/petugas/detail-gadai/${id}`;
      case "checker": return `/checker/detail-gadai/${id}`;
      default: return `/detail-gadai/${id}`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(getApiUrl());
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
  }, [id, userRole]);

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  if (!data) return <p>Tidak ada data.</p>;

  const detail = data;
  const nasabah = detail?.nasabah || {};
  const petugas = nasabah?.user?.name || "-";
  const typeNama = detail?.type?.nama_type?.toLowerCase() || "-";
  const pokok = Number(detail?.uang_pinjaman || 0);

  const perpanjanganList = detail?.perpanjangan_tempos || [];
  const perpanjanganTerakhir = perpanjanganList.length > 0 ? perpanjanganList[perpanjanganList.length - 1] : null;
  const perpanjanganSebelum = perpanjanganList.length > 1 ? perpanjanganList[perpanjanganList.length - 2] : null;

  const jatuhTempoLama = perpanjanganSebelum?.jatuh_tempo_baru || detail.jatuh_tempo;
  const tanggalPerpanjangan = perpanjanganTerakhir?.tanggal_perpanjangan || new Date().toISOString();
  const jatuhTempoBaru = perpanjanganTerakhir?.jatuh_tempo_baru || detail?.jatuh_tempo;

  const today = new Date();
  const formatHariTanggal = (date) => {
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const pad = (n) => n.toString().padStart(2, "0");
    return {
      tanggalStr: `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`,
      jamStr: `${pad(date.getHours())}:${pad(date.getMinutes())}`
    };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(today);
  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  // ============================================================
  // 🔹 LOGIKA PERHITUNGAN BARU (DISINKRONKAN DENGAN CONTROLLER BE)
  // ============================================================
  
  const isHandphoneElektronik = ["handphone", "hp", "elektronik"].includes(typeNama);

  // 1. Selisih Hari
  const totalTelat = Math.max(0, Math.ceil((new Date(tanggalPerpanjangan) - new Date(jatuhTempoLama)) / (1000 * 60 * 60 * 24)));
  const periodeBaruHari = Math.max(0, Math.ceil((new Date(jatuhTempoBaru) - new Date(tanggalPerpanjangan)) / (1000 * 60 * 60 * 24)));

  // 2. Jasa Perpanjangan (Berjenjang: 15 hari vs 30 hari)
  let jasaBaru = 0;
  if (isHandphoneElektronik) {
    // HP: 1-15 hari (4.5%), >15 hari (9.5%)
    jasaBaru = (periodeBaruHari <= 15) ? (pokok * 0.045) : (pokok * 0.095);
  } else {
    // Emas/Lainnya: 1-15 hari (1.5%), >15 hari (2.5%)
    jasaBaru = (periodeBaruHari <= 15) ? (pokok * 0.015) : (pokok * 0.025);
  }

  // 3. Denda (HP 0.3%, Emas 0.1%)
  const rateDenda = isHandphoneElektronik ? 0.003 : 0.001;
  const denda = pokok * rateDenda * totalTelat;

  // 4. Penalty (Telat > 15 hari)
  const penalty = totalTelat > 15 ? 180000 : 0;

  // 5. Admin (HP = 0, Emas = Max(1% pokok, 10rb))
  let admin = 0;
  if (!isHandphoneElektronik) {
    admin = Math.max(pokok * 0.01, 10000);
  }

  // 6. Total Akhir & Pembulatan (Sesuai BE: ceil ke 1000 terdekat)
  const totalBayar = Math.ceil((jasaBaru + denda + penalty + admin) / 1000) * 1000;

  // ============================================================

  const cleanText = (val) => {
    if (!val) return "-";
    const str = typeof val === 'object' ? (val.nama_merk || val.nama_type || String(val)) : String(val);
    return str.replace(/,|\/+/g, "").replace(/\s+/g, " ").trim();
  };

  const formatLabel = (text) => text ? String(text).replace(/_/g, " ").toUpperCase() : "-";

  let barangNama = "-", barangDetail = "-", labelBarangDetail = "-";

  switch (typeNama) {
    case "handphone":
    case "hp":
    case "elektronik":
      if (detail.hp) {
        barangNama = cleanText(detail.hp.nama_barang);
        const merk = formatLabel(detail.hp.merk?.nama_merk || detail.hp.merk);
        const typeHp = formatLabel(detail.hp.type_hp?.nama_type || detail.hp.type_hp);
        barangDetail = `MERK / TYPE : ${merk} / ${typeHp}\nROM / RAM   : ${cleanText(detail.hp.rom)} / ${cleanText(detail.hp.ram)}\nGRADE       : ${formatLabel(detail.hp.grade_type)}`;
        labelBarangDetail = ""; 
      }
      break;
    default:
      const obj = detail.perhiasan || detail.logam_mulia || detail.retro;
      if (obj) {
        barangNama = cleanText(obj.nama_barang);
        barangDetail = `${cleanText(obj.karat)} / ${cleanText(obj.berat)}`;
        labelBarangDetail = "Karat / Berat";
      }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
    <html>
      <head>
        <title>Struk Perpanjangan</title>
        <style>
          @media print { @page { size: 80mm auto; margin: 0; } body { width: 80mm; margin: 0; padding: 0; } }
          body { font-family: "Consolas", monospace; font-size: 11px; font-weight: 700; line-height: 1.25; }
          .print-box { padding: 2px 3px; }
          .center { text-align: center; }
          .bold { font-weight: 800; }
          img { display: block; margin: 0 auto 2px auto; width: 110px; }
          hr { border: none; border-top: 1px dashed #000; margin: 3px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 1px; }
          pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: inherit; }
        </style>
      </head>
      <body>
        <div class="print-box">
          <div class="center"><img src="${logo}" /><div>No Transaksi</div><div class="bold">${detail?.no_gadai || "-"}</div></div>
          <div class="row"><span>Hari, Tanggal</span><span>${tanggalStr}</span></div>
          <div class="row"><span>Waktu</span><span>${jamStr}</span></div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>
          <div class="center bold" style="margin: 4px 0;">PERPANJANGAN GADAI</div>
          <div class="row"><span>Nama Barang</span><span>${barangNama}</span></div>
          <div class="row"><span>${labelBarangDetail}</span><span><pre>${barangDetail}</pre></span></div>
          <hr />
          <div class="row"><span>Pokok Pinjaman</span><span>${formatRupiah(pokok)}</span></div>
          <div class="row"><span>Jasa Baru</span><span>${formatRupiah(jasaBaru)}</span></div>
          <div class="row"><span>Denda</span><span>${formatRupiah(denda)}</span></div>
          ${penalty > 0 ? `<div class="row"><span>Penalty</span><span>${formatRupiah(penalty)}</span></div>` : ""}
          <div class="row"><span>Admin</span><span>${formatRupiah(admin)}</span></div>
          <hr />
          <div class="row bold"><span>Total Bayar</span><span>${formatRupiah(totalBayar)}</span></div>
          <hr />
          <div class="row"><span>Telat</span><span>${totalTelat} hari</span></div>
          <div class="row"><span>Periode Baru</span><span>${periodeBaruHari} hari</span></div>
          <div class="row"><span>Jatuh Tempo Baru</span><span>${jatuhTempoBaru}</span></div>
          <div class="thanks" style="text-align:center; margin-top:10px;">
            <div class="bold">Terima kasih atas kepercayaan Anda!</div>
            <div class="bold">SENTRA GADAI INDONESIA</div>
          </div>
        </div>
        <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 150); };</script>
      </body>
    </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", p: 2, textAlign: "center", fontFamily: "monospace" }}>
      <Paper elevation={0} ref={printRef} style={{ border: "1px dashed #ccc", padding: "12px", marginBottom: "12px" }}>
        <img src={logo} alt="Logo" style={{ width: "120px", margin: "0 auto 8px auto" }} />
        <div>No Transaksi: <b>{detail?.no_gadai || "-"}</b></div>
        <div>Hari, Tanggal: {tanggalStr}</div>
        <div>Waktu: {jamStr}</div>
        <div>Petugas: {petugas}</div>
        <div style={{ marginTop: "6px", fontWeight: "bold" }}>PERPANJANGAN GADAI</div>
        <div style={{ textAlign: "left", marginTop: "6px" }}>
          <div>Nama Barang: {barangNama}</div>
          <div>{labelBarangDetail}: {barangDetail}</div>
          <hr />
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Pokok Pinjaman:</span><span>{formatRupiah(pokok)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Jasa Baru:</span><span>{formatRupiah(jasaBaru)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Denda:</span><span>{formatRupiah(denda)}</span></div>
          {penalty > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Penalty:</span><span>{formatRupiah(penalty)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Admin:</span><span>{formatRupiah(admin)}</span></div>
          <hr />
          <div><b>Total Bayar: {formatRupiah(totalBayar)}</b></div>
          <div style={{ fontSize: "11px", marginTop: "5px" }}>
            <div>Telat: {totalTelat} hari</div>
            <div>Jatuh Tempo Baru: {jatuhTempoBaru}</div>
          </div>
        </div>
      </Paper>
      <Button variant="contained" color="primary" fullWidth onClick={handlePrint}>Cetak Struk Perpanjangan</Button>
    </Box>
  );
};

export default PrintStrukPerpanjanganPage;