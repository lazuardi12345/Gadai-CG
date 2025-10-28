import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  pdf,
} from "@react-pdf/renderer";
import templateBg from "assets/images/SBG.png";

// Daftarkan font Roboto
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

// Styles PDF (setengah F4 portrait)
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 15,
    fontSize: 11,
    fontFamily: "Roboto",
    width: 210,   // mm
    height: 165,  // mm
    position: "relative",
  },
  section: { marginBottom: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  barangRow: { flexDirection: "row", justifyContent: "space-between" },
  imageBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.1,
  },
});

// Komponen PDF surat
const SuratBuktiGadaiPDF = ({ data, type }) => {
  const detail = data;
  const nasabah = detail?.nasabah || {};

  const barangMap = {
    hp: detail?.hp && {
      "Nama Barang": detail.hp.nama_barang,
      Merk: detail.hp.merk,
      Tipe: detail.hp.type_hp,
      IMEI: detail.hp.imei,
      Warna: detail.hp.warna,
      Kelengkapan: detail.hp.kelengkapan,
      Kerusakan: detail.hp.kerusakan,
    },
    perhiasan: detail?.perhiasan && {
      "Nama Barang": detail.perhiasan.nama_barang,
      Karat: detail.perhiasan.karat,
      Berat: detail.perhiasan.berat,
      "Tipe Perhiasan": detail.perhiasan.type_perhiasan,
      Kelengkapan: detail.perhiasan.kelengkapan,
      "Kode Cap": detail.perhiasan.kode_cap,
      "Potongan Batu": detail.perhiasan.potongan_batu,
    },
    "logam-mulia": detail?.logam_mulia && {
      "Nama Barang": detail.logam_mulia.nama_barang,
      Karat: detail.logam_mulia.karat,
      Berat: detail.logam_mulia.berat,
      "Tipe Logam Mulia": detail.logam_mulia.type_logam_mulia,
      Kelengkapan: detail.logam_mulia.kelengkapan,
      "Kode Cap": detail.logam_mulia.kode_cap,
      "Potongan Batu": detail.logam_mulia.potongan_batu,
    },
    retro: detail?.retro && {
      "Nama Barang": detail.retro.nama_barang,
      Karat: detail.retro.karat,
      Berat: detail.retro.berat,
      "Tipe Retro": detail.retro.type_retro,
      Kelengkapan: detail.retro.kelengkapan,
      "Kode Cap": detail.retro.kode_cap,
      "Potongan Batu": detail.retro.potongan_batu,
    },
  };

  const barang = barangMap[type] || {};

  return (
    <Document>
      <Page size={{ width: 210, height: 165 }} style={styles.page}>
        <Image src={templateBg} style={styles.imageBg} />

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <View>
              <Text>No. Gadai: {detail.no_gadai}</Text>
              <Text>No. Nasabah: {detail.no_nasabah}</Text>
              <Text>Nama Nasabah: {nasabah.nama_lengkap}</Text>
              <Text>Alamat: {nasabah.alamat}</Text>
              <Text>No. HP: {nasabah.no_hp}</Text>
            </View>
            <View>
              <Text>Tanggal Gadai: {detail.tanggal_gadai}</Text>
              <Text>Jatuh Tempo: {detail.jatuh_tempo}</Text>
              <Text>
                Taksiran: Rp {Number(detail.taksiran || 0).toLocaleString("id-ID")}
              </Text>
              <Text>
                Pinjaman: Rp {Number(detail.uang_pinjaman || 0).toLocaleString("id-ID")}
              </Text>
              <Text>Status: {detail.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Barang Gadai</Text>
          {Object.entries(barang).map(([key, value]) => (
            <View key={key} style={styles.barangRow}>
              <Text>{key}:</Text>
              <Text>{value || "-"}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20, alignItems: "center" }}>
          <Text>
            Bogor,{" "}
            {detail.tanggal_gadai
              ? new Date(detail.tanggal_gadai).toLocaleDateString("id-ID")
              : "-"}
          </Text>
          <Text style={{ marginTop: 10, textDecoration: "underline" }}>
            {nasabah.nama_lengkap}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Halaman utama
const PrintSuratGadaiPage = () => {
  const { id } = useParams();
  const [dataGadai, setDataGadai] = useState(null);
  const [loading, setLoading] = useState(true);

  const getTypeName = (typeId) => {
    switch (Number(typeId)) {
      case 1:
        return "hp";
      case 2:
        return "perhiasan";
      case 3:
        return "logam-mulia";
      case 4:
        return "retro";
      default:
        return "";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/detail-gadai");
        if (res.data?.success && Array.isArray(res.data.data)) {
          const found = res.data.data.find((item) => item.id === Number(id));
          setDataGadai(found || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const typeName = getTypeName(dataGadai?.type_id);

  const handlePrint = async () => {
    if (!dataGadai) return;
    const blob = await pdf(
      <SuratBuktiGadaiPDF data={dataGadai} type={typeName} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.contentWindow.print();
  };

  if (loading)
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  if (!dataGadai) return <p>Data gadai tidak ditemukan.</p>;

  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Button variant="contained" color="primary" onClick={handlePrint}>
        Cetak Surat Bukti Gadai
      </Button>

      <Box mt={2}>
        <PDFDownloadLink
          document={<SuratBuktiGadaiPDF data={dataGadai} type={typeName} />}
          fileName={`Surat-Bukti-Gadai-${dataGadai.no_gadai}.pdf`}
        >
          {({ loading }) =>
            loading ? "Menyiapkan file..." : "Download Surat Bukti Gadai"
          }
        </PDFDownloadLink>
      </Box>
    </Box>
  );
};

export default PrintSuratGadaiPage;
