import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import { AuthContext } from "AuthContex/AuthContext";
import logo from "assets/images/CGadai.png";

const PrintStrukPage = () => {
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

  // 🔹 Fetch Data
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

  if (loading) return <CircularProgress />;
  if (!data) return <p>Tidak ada data.</p>;

  const detail = data || {};
  const nasabah = detail?.nasabah || {};
  const petugas = nasabah?.user?.name || "-";
  const typeNama = detail?.type?.nama_type || "-";


  const pinjaman = Number(detail?.uang_pinjaman || 0);
  const tglGadai = new Date(detail?.tanggal_gadai);
  const tglJatuhTempo = new Date(detail?.jatuh_tempo);

  // === Hitung lama hari ===
  let selisihHari = Math.ceil((tglJatuhTempo - tglGadai) / (1000 * 60 * 60 * 24));

  // Tambahkan toleransi 1 hari
  const blokHari = [15, 30, 45, 60, 75, 90, 105, 120];
  for (let batas of blokHari) {
    if (selisihHari === batas + 1) {
      selisihHari = batas;
      break;
    }
  }

  let persenJasa = 0;
  let jenisSkema = "";
  const typeLower = (typeNama || "").toLowerCase();

  // === Jika barang HP ===
  if (typeLower === "handphone" || typeLower === "hp") {
    jenisSkema = "HP";
    if (selisihHari <= 15) persenJasa = 0.045;
    else if (selisihHari <= 30) persenJasa = 0.095;
    else if (selisihHari <= 45) persenJasa = 0.145;
    else if (selisihHari <= 60) persenJasa = 0.195;
    else {
      const extraBlocks = Math.ceil((selisihHari - 60) / 15);
      persenJasa = 0.195 + extraBlocks * 0.05;
    }
  } else {
    // === Barang selain HP ===
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

  // === Administrasi minimal fix ===
  let adminPersen = pinjaman * 0.01; // 1% dari pinjaman
  let admin = adminPersen;

  if (["logam mulia", "retro", "perhiasan"].includes(typeLower)) {
    admin = Math.max(adminPersen, 10000); // Minimal Rp 10.000
  } else if (["handphone", "hp", "elektronik"].includes(typeLower)) {
    admin = Math.max(adminPersen, 5000); // Minimal Rp 5.000
  } else {
    admin = Math.max(adminPersen, 5000); // Default minimal Rp 5.000
  }

  // === Asuransi tetap ===
  const asuransi = 10000;

  // === Total diterima ===
  const totalDiterima = pinjaman - jasaSewa - admin - asuransi;

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  const formatHariTanggal = (date) => {
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const tanggalStr = `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
    const pad = (n) => n.toString().padStart(2, "0");
    const jamStr = `Waktu: ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return { tanggalStr, jamStr };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(new Date());

  let barangNama = "-";
  let barangDetail = "-";
  let labelBarangDetail = "-";

  const toText = (value) => {
    if (!value) return "-";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.join(", ");
        return parsed;
      } catch {
        return value;
      }
    }
    return String(value);
  };

  const type = (typeNama || "").toLowerCase();

  // === Handphone ===
  if (type === "handphone" && detail.hp) {
    const hp = detail.hp;
    barangNama = hp?.nama_barang || "Handphone";
    const merk = (hp?.merk || "").trim();
    const type_hp = (hp?.type_hp || "").trim();
    const ram = (hp?.ram || "").trim();
    const rom = (hp?.rom || "").trim();
    barangDetail = `Merk/Type: ${merk} / ${type_hp}\nRAM/ROM: ${ram} / ${rom}`;
    labelBarangDetail = "Detail Handphone";
  }

  // === Perhiasan ===
  else if (type === "perhiasan") {
    const p = detail?.perhiasan ?? {};
    barangNama = p?.nama_barang || "Perhiasan";
    const karat = p?.karat ?? "-";
    const berat = p?.berat ?? "-";
    barangDetail = `Karat: ${karat} / Berat: ${berat}`;
    labelBarangDetail = "Detail Perhiasan";
  }

  // === Logam Mulia ===
  else if (type === "logam mulia") {
    const lm = detail?.logam_mulia ?? {};
    barangNama = lm?.nama_barang || "Logam Mulia";
    const karat = lm?.karat ?? "-";
    const berat = lm?.berat ?? "-";
    barangDetail = `Karat: ${karat} / Berat: ${berat}`;
    labelBarangDetail = "Detail Logam Mulia";
  }

  // === Retro ===
  else if (type === "retro") {
    const r = detail?.retro ?? {};
    barangNama = r?.nama_barang || "Retro";
    const karat = r?.karat ?? "-";
    const berat = r?.berat ?? "-";
    barangDetail = `Karat: ${karat} / Berat: ${berat}`;
    labelBarangDetail = "Detail Retro";
  }

  // === Default ===
  else {
    barangNama = detail?.nama_barang || "-";
    barangDetail = "-";
    labelBarangDetail = "Detail Barang";
  }

 
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
            pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
          </style>
        </head>
        <body>
          <div class="print-box">
            <div class="center">
              <img src="${logo}" alt="Logo" />
              <div>No Transaksi</div>
              <div class="bold">${detail?.no_gadai || "-"}</div>
            </div>

            <div class="row"><span class="label">Hari, Tanggal</span><span class="value">${tanggalStr}</span></div>
            <div class="row"><span class="label">Waktu</span><span class="value">${jamStr}</span></div>
            <div class="row"><span class="label">Petugas</span><span class="value">${petugas}</span></div>

            <div class="center bold" style="margin: 6px 0;">TRANSAKSI GADAI</div>

            <div class="row"><span class="label">Harga Taksiran</span><span class="value">${formatRupiah(detail?.taksiran)}</span></div>
            <div class="row"><span class="label">Harga Pinjaman</span><span class="value">${formatRupiah(detail?.uang_pinjaman)}</span></div>
            <div class="row"><span class="label">Barang Gadai</span><span class="value">${typeNama}</span></div>
            <hr />

            <div class="row"><span class="label">Nama Barang</span><span class="value">${barangNama}</span></div>
            <div class="row"><span class="label">${labelBarangDetail}</span><span class="value"><pre>${barangDetail}</pre></span></div>
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

            <div class="center" style="font-size:10px; margin-top:6px;">
              <div>* Biaya admin minimal Rp 5.000 (HP) dan Rp 10.000 (Emas/Perhiasan)</div>
            </div>

            <div class="center" style="margin-top:6px;">
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

        <div style={{ marginTop: "4px" }}>{tanggalStr}</div>
        <div style={{ marginBottom: "4px", fontWeight: "bold" }}>{jamStr}</div>
        <div>Petugas {petugas}</div>

        <div style={{ marginTop: "6px", fontWeight: "bold" }}>TRANSAKSI GADAI</div>

        <div style={{ textAlign: "left", marginTop: "6px" }}>
          <div>Harga Taksiran {formatRupiah(detail?.taksiran)}</div>
          <div>Harga Pinjaman {formatRupiah(detail?.uang_pinjaman)}</div>
          <div>Barang Gadai {typeNama}</div>
          <hr />
          <div>Nama Barang: {barangNama}</div>
          <pre>{labelBarangDetail}: {barangDetail}</pre>
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
          <p>* Biaya admin minimal Rp 5.000 (HP) dan Rp 10.000 (Emas/Perhiasan)</p>
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
