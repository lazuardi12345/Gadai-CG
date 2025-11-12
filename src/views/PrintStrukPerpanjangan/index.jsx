import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import logo from "assets/images/CGadai.png";
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
      case "petugas":
        return `/petugas/detail-gadai/${id}`;
      case "checker":
        return `/checker/detail-gadai/${id}`;
      case "hm":
      default:
        return `/detail-gadai/${id}`;
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

  if (loading)
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  if (!data) return <p>Tidak ada data.</p>;

  const detail = data;
  const nasabah = detail?.nasabah || {};
  const petugas = nasabah?.user?.name || "-";
  const typeNama = detail?.type?.nama_type?.toLowerCase() || "-";
  const pokok = Number(detail?.uang_pinjaman || 0);

  // Ambil perpanjangan terakhir
  const perpanjanganList = detail?.perpanjangan_tempos || [];
  const perpanjanganTerakhir =
    perpanjanganList.length > 0 ? perpanjanganList[perpanjanganList.length - 1] : null;

  // Ambil perpanjangan sebelumnya (kalau ada)
  const perpanjanganSebelum =
    perpanjanganList.length > 1 ? perpanjanganList[perpanjanganList.length - 2] : null;

  // Tentukan jatuh tempo lama → dari perpanjangan sebelumnya, kalau ada
  const jatuhTempoLama =
    perpanjanganSebelum?.jatuh_tempo_baru || detail.jatuh_tempo;

  // Tanggal perpanjangan dan jatuh tempo baru dari perpanjangan terakhir
  const tanggalPerpanjangan =
    perpanjanganTerakhir?.tanggal_perpanjangan || new Date().toISOString();
  const jatuhTempoBaru =
    perpanjanganTerakhir?.jatuh_tempo_baru || detail?.jatuh_tempo;

  const today = new Date();

  const formatHariTanggal = (date) => {
    const hari = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const bulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const pad = (n) => n.toString().padStart(2, "0");
    const tanggalStr = `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]
      } ${date.getFullYear()}`;
    const jamStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return { tanggalStr, jamStr };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(today);

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  // ==========================================
  // 🔹 Kalkulasi denda, admin, penalty terbaru
  // ==========================================

  const MAX_TELAT_HARI = 15;
  const FIX_PENALTY = 180000;
  const BARANG_EMAS = ["logam mulia", "retro", "perhiasan"];

  const hitungDenda = (pokok, jenisBarang, telatHari) => {
    if (telatHari <= 0) return 0;

    if (["handphone", "elektronik"].includes(jenisBarang)) {
      // HP & elektronik: 0.3% per hari
      return pokok * 0.003 * telatHari;
    } else if (BARANG_EMAS.includes(jenisBarang)) {
      // Emas (retro, logam mulia, perhiasan): 0.1% per hari
      return pokok * 0.001 * telatHari;
    }

    return 0;
  };

  const hitungPenalty = (telatHari) => {
    return telatHari > MAX_TELAT_HARI ? FIX_PENALTY : 0;
  };

  const hitungAdmin = (jenisBarang, pokok) => {
    const adminPersen = pokok * 0.01; // 1% dari pinjaman
    if (BARANG_EMAS.includes(jenisBarang)) {
      return Math.max(adminPersen, 10000); // minimal 10rb
    } else if (["handphone", "hp", "elektronik"].includes(jenisBarang)) {
      return Math.max(adminPersen, 5000); // minimal 5rb
    } else {
      return Math.max(adminPersen, 5000); // default minimal 5rb
    }
  };


  // ==========================================

  const hitungJasaBaru = (pokok, jenisBarang, periodeHari) => {
    if (periodeHari <= 0) return 0;
    let jasa = 0;
    if (["handphone", "elektronik"].includes(jenisBarang)) {
      const periode30 = Math.floor(periodeHari / 30);
      const sisa = periodeHari % 30;
      jasa += periode30 * pokok * 0.095;
      if (sisa > 0) jasa += pokok * 0.045;
    } else {
      const periode30 = Math.floor(periodeHari / 30);
      const sisa = periodeHari % 30;
      jasa += periode30 * pokok * 0.025;
      if (sisa > 0) jasa += pokok * 0.015;
    }
    return jasa;
  };

  const totalTelat = Math.max(
    0,
    Math.ceil(
      (new Date(tanggalPerpanjangan) - new Date(jatuhTempoLama)) /
      (1000 * 60 * 60 * 24)
    )
  );

  const periodeBaruHari = Math.max(
    0,
    Math.ceil(
      (new Date(jatuhTempoBaru) - new Date(tanggalPerpanjangan)) /
      (1000 * 60 * 60 * 24)
    )
  );

  const jasaBaru = hitungJasaBaru(pokok, typeNama, periodeBaruHari);
  const denda = hitungDenda(pokok, typeNama, totalTelat);
  const penalty = hitungPenalty(totalTelat);
  const admin = hitungAdmin(typeNama, pokok);
  const totalBayar = jasaBaru + denda + penalty + admin;

  // 🔹 Bersihkan nama barang
  const cleanText = (val) =>
    (val || "").replace(/,|\/+/g, "").replace(/\s+/g, " ").trim();

  let barangNama = "-",
    barangDetail = "-",
    labelBarangDetail = "-";
  switch (typeNama) {
    case "handphone":
    case "elektronik":
      if (detail.hp) {
        barangNama = cleanText(detail.hp.nama_barang);
        const merk = cleanText(detail.hp.merk);
        const typeHp = cleanText(detail.hp.type_hp);
        barangDetail = `${merk} / ${typeHp}`;
        labelBarangDetail = "Merk / Type";
      }
      break;
    case "perhiasan":
    case "logam mulia":
    case "retro":
    case "emas":
      const obj = detail.perhiasan || detail.logam_mulia || detail.retro;
      if (obj) {
        barangNama = cleanText(obj.nama_barang);
        const karat = cleanText(obj.karat);
        const berat = cleanText(obj.berat);
        barangDetail = `${karat} / ${berat}`;
        labelBarangDetail = "Karat / Berat";
      }
      break;
  }

  // 🔹 Cetak
  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(printHTML());
    printWindow.document.close();
  };

  const printHTML = () => `
    <html>
      <head>
        <title>Struk Perpanjangan</title>
        <style>
          @page { size: 80mm auto; margin:0; }
          body { font-family: monospace; font-size:11px; margin:0; padding:0; }
          .print-box { width:80mm; margin:0 auto; padding:6px; }
          .center { text-align:center; }
          .bold { font-weight:bold; }
          img { display:block; margin:0 auto 6px auto; width:150px; }
          .row { display:flex; justify-content:space-between; margin-bottom:2px; }
          hr { border:none; border-top:1px dashed #000; margin:5px 0; }
        </style>
      </head>
      <body>
        <div class="print-box">
          <div class="center">
            <img src="${logo}" alt="Logo" />
            <div>No Transaksi</div>
            <div class="bold">${detail?.no_gadai || "-"}</div>
          </div>

          <div class="row"><span>Hari, Tanggal</span><span>${tanggalStr}</span></div>
          <div class="row"><span>Waktu</span><span>${jamStr}</span></div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>

          <div class="center bold" style="margin:6px 0;">PERPANJANGAN GADAI</div>
          <div class="row"><span>Nama Barang</span><span>${barangNama}</span></div>
          <div class="row"><span>${labelBarangDetail}</span><span>${barangDetail}</span></div>
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
          <div class="row"><span>Tanggal Gadai</span><span>${detail?.tanggal_gadai}</span></div>
          <div class="row"><span>Jatuh Tempo Lama</span><span>${jatuhTempoLama}</span></div>
          <div class="row"><span>Tanggal Perpanjangan</span><span>${tanggalPerpanjangan}</span></div>
          <div class="row"><span>Jatuh Tempo Baru</span><span>${jatuhTempoBaru}</span></div>
          <hr />

           <div class="center" style="font-size:10px; margin-top:6px;">
              <div>* Biaya admin minimal Rp 5.000 (HP) dan Rp 10.000 (Emas/Perhiasan)</div>
            </div>
            
          <div class="center">
            <div>Terima kasih atas kepercayaan Anda!</div>
            <div>Gadai cepat, aman, dan terpercaya di</div>
            <div class="bold">CG GADAI.</div>
          </div>
        </div>
        <script>window.onload = function(){window.print(); window.close();}</script>
      </body>
    </html>
  `;

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", p: 2, textAlign: "center", fontFamily: "monospace" }}>
      <div ref={printRef} style={{ border: "1px dashed #ccc", padding: "12px", marginBottom: "12px" }}>
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
          <div>Pokok Pinjaman: {formatRupiah(pokok)}</div>
          <div>Jasa Baru: {formatRupiah(jasaBaru)}</div>
          <div>Denda: {formatRupiah(denda)}</div>
          {penalty > 0 && <div>Penalty: {formatRupiah(penalty)}</div>}
          <div>Admin: {formatRupiah(admin)}</div>
          <hr />
          <div>Telat: {totalTelat} hari</div>
          <div>Periode Baru: {periodeBaruHari} hari</div>
          <div><b>Total Bayar: {formatRupiah(totalBayar)}</b></div>
          <div>Tanggal Gadai: {detail?.tanggal_gadai}</div>
          <div>Jatuh Tempo Lama: {jatuhTempoLama}</div>
          <div>Tanggal Perpanjangan: {tanggalPerpanjangan}</div>
          <div>Jatuh Tempo Baru: {jatuhTempoBaru}</div>
        </div>

        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <p>* Biaya admin minimal Rp 5.000 (HP) dan Rp 10.000 (Emas/Perhiasan)</p>
          <p>Terima kasih atas kepercayaan Anda!</p>
          <p>Gadai cepat, aman, dan terpercaya di</p>
          <p><b>CG GADAI.</b></p>
        </div>
      </div>

      <Button variant="contained" color="primary" onClick={handlePrint}>
        Cetak Struk Perpanjangan
      </Button>
    </Box>
  );
};

export default PrintStrukPerpanjanganPage;
