import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import { AuthContext } from "AuthContex/AuthContext";
import logo from "assets/images/CGadai.png";

const PrintStrukPelunasanPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  // 🔹 Tentukan endpoint API berdasarkan role
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

  // 🔹 Ambil data
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

  // 🔹 Ambil jatuh tempo terbaru jika diperpanjang
  const perpanjanganTerbaru = detail?.perpanjangan_tempos?.length
    ? detail.perpanjangan_tempos[detail.perpanjangan_tempos.length - 1]
    : null;
  const jatuhTempoTerbaru =
    perpanjanganTerbaru?.jatuh_tempo_baru || detail?.jatuh_tempo;

  // 🔹 Hitung denda dan penalty
  const today = new Date();
  const jatuhTempoDate = new Date(jatuhTempoTerbaru);

  let selisihHari = Math.ceil((today - jatuhTempoDate) / (1000 * 60 * 60 * 24));
  const toleransi = 1;
  if (selisihHari <= toleransi) selisihHari = 0;
  else selisihHari -= toleransi;

  let jenisSkema = ["handphone", "elektronik"].includes(typeNama)
    ? "hp"
    : "non-hp";
  let denda = 0,
    penalty = 0;

  if (selisihHari > 0) {
    const persenDendaPerHari = jenisSkema === "hp" ? 0.003 : 0.001; // 0.3% hp / 0.1% emas
    denda = pokok * persenDendaPerHari * selisihHari;
    if (selisihHari > 15) penalty = 180000;
  }

  const totalBayar = pokok + denda + penalty;

  // 🔹 Helper format
  const formatRupiah = (val) =>
    `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

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
    const tanggalStr = `${hari[date.getDay()]}, ${date.getDate()} ${
      bulan[date.getMonth()]
    } ${date.getFullYear()}`;
    const jamStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return { tanggalStr, jamStr };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(today);

  // 🔹 Detail barang
  let barangNama = "-",
    barangDetail = "-",
    labelBarangDetail = "-";

  const cleanText = (val) =>
    (val || "").replace(/,|\/+/g, "").replace(/\s+/g, " ").trim();

  switch (typeNama) {
    case "handphone":
    case "elektronik":
      if (detail.hp) {
        barangNama = cleanText(detail.hp.nama_barang);
        const merk = cleanText(detail.hp.merk);
        const typeHp = cleanText(detail.hp.type_hp);
        const ram = cleanText(detail.hp.ram);
        const rom = cleanText(detail.hp.rom);
        barangDetail = `${merk} / ${typeHp}\n${ram} / ${rom}`;
        labelBarangDetail = "Merk / Type | RAM / ROM";
      }
      break;
    case "perhiasan":
    case "logam mulia":
    case "retro":
      const item = detail.perhiasan || detail.logam_mulia || detail.retro;
      if (item) {
        barangNama = cleanText(item.nama_barang);
        const karat = cleanText(item.karat);
        const berat = cleanText(item.berat);
        barangDetail = `${karat} / ${berat}`;
        labelBarangDetail = "Karat / Berat";
      }
      break;
    default:
      barangNama = "-";
      barangDetail = "-";
  }

  // 🔹 Fungsi cetak struk
  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pelunasan</title>
          <style>
            @page { size: 80mm auto; margin:0; }
            body { font-family: monospace; font-size:11px; margin:0; padding:0; }
            .print-box { width:80mm; margin:0 auto; padding:6px; }
            .center { text-align:center; }
            .bold { font-weight:bold; }
            img { display:block; margin:0 auto 6px auto; width:150px; }
            .row { display:flex; justify-content:space-between; margin-bottom:2px; }
            hr { border:none; border-top:1px dashed #000; margin:5px 0; }
            pre { white-space: pre-wrap; word-break: break-word; margin:0; }
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

            <div class="center bold" style="margin:6px 0;">PEMBAYARAN LUNAS</div>

            <div class="row"><span>Nama Barang</span><span>${barangNama}</span></div>
            <div class="row"><span>${labelBarangDetail}</span><span><pre>${barangDetail}</pre></span></div>
            <hr />

            <div class="row"><span>Pokok Pinjaman</span><span>${formatRupiah(pokok)}</span></div>
            ${denda > 0 ? `<div class="row"><span>Denda</span><span>${formatRupiah(denda)}</span></div>` : ""}
            ${penalty > 0 ? `<div class="row"><span>Penalty</span><span>${formatRupiah(penalty)}</span></div>` : ""}
            <div class="row"><span>Telat</span><span>${selisihHari} hari</span></div>
            <div class="row bold"><span>Total Bayar</span><span>${formatRupiah(totalBayar)}</span></div>
            <hr />

            <div class="row"><span>Tanggal Gadai</span><span>${detail?.tanggal_gadai || "-"}</span></div>
            <div class="row"><span>Jatuh Tempo</span><span>${jatuhTempoTerbaru}</span></div>
            <hr />

            <div class="center">
              <div>Terima kasih atas kepercayaan Anda!</div>
              <div>Gadai cepat, aman, dan terpercaya di</div>
              <div class="bold">CG GADAI.</div>
            </div>
          </div>
          <script>window.onload = function(){window.print(); window.close();}</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", p: 2, textAlign: "center", fontFamily: "monospace" }}>
      <div ref={printRef} style={{ border: "1px dashed #ccc", padding: "12px", marginBottom: "12px" }}>
        <img src={logo} alt="Logo" style={{ width: "120px", margin: "0 auto 8px auto" }} />
        <div>No Transaksi: <b>{detail?.no_gadai || "-"}</b></div>
        <div>Hari, Tanggal: {tanggalStr}</div>
        <div>Waktu: {jamStr}</div>
        <div>Petugas: {petugas}</div>

        <div style={{ marginTop: "6px", fontWeight: "bold" }}>PEMBAYARAN LUNAS</div>

        <div style={{ textAlign: "left", marginTop: "6px" }}>
          <div>Nama Barang: {barangNama}</div>
          <pre>{labelBarangDetail}: {barangDetail}</pre>
          <hr />
          <div>Pokok Pinjaman: {formatRupiah(pokok)}</div>
          {denda > 0 && <div>Denda: {formatRupiah(denda)}</div>}
          {penalty > 0 && <div>Penalty: {formatRupiah(penalty)}</div>}
          <div>Telat: {selisihHari} hari</div>
          <div><b>Total Bayar: {formatRupiah(totalBayar)}</b></div>
          <div>Tanggal Gadai: {detail?.tanggal_gadai || "-"}</div>
          <div>Jatuh Tempo: {jatuhTempoTerbaru}</div>
        </div>

        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <p>Terima kasih atas kepercayaan Anda!</p>
          <p>Gadai cepat, aman, dan terpercaya di</p>
          <p><b>CG GADAI.</b></p>
        </div>
      </div>

      <Button variant="contained" color="primary" onClick={handlePrint}>
        Cetak Struk Pelunasan
      </Button>
    </Box>
  );
};

export default PrintStrukPelunasanPage;
