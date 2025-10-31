import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box, Typography } from "@mui/material";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  pdf,
} from "@react-pdf/renderer";
import templateBg from "assets/images/SBG-HP.jpg";

// ✅ Daftarkan font Roboto
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

// ✅ Komponen aman untuk render teks
const SafeText = ({ children, style }) => {
  let content = "-";
  if (children !== null && children !== undefined && children !== "") {
    content = String(children);
  }
  return <Text style={style}>{content}</Text>;
};

// ✅ Konversi ukuran mm → pt
const DESIGN_WIDTH_MM = 187;
const DESIGN_HEIGHT_MM = 263;
const DESIGN_WIDTH_PT = DESIGN_WIDTH_MM * 2.83465;
const DESIGN_HEIGHT_PT = DESIGN_HEIGHT_MM * 2.83465;

// ✅ Utility
const formatRupiah = (number) => {
  if (!number) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const terbilang = (angka) => {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  angka = parseInt(angka, 10);
  if (isNaN(angka)) return "-";
  if (angka < 12) return bilangan[angka];
  if (angka < 20) return terbilang(angka - 10) + " Belas";
  if (angka < 100)
    return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
  if (angka < 200) return "Seratus " + terbilang(angka - 100);
  if (angka < 1000)
    return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
  if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
  if (angka < 1000000)
    return (
      terbilang(Math.floor(angka / 1000)) +
      " Ribu " +
      terbilang(angka % 1000)
    );
  if (angka < 1000000000)
    return (
      terbilang(Math.floor(angka / 1000000)) +
      " Juta " +
      terbilang(angka % 1000000)
    );
  return "Angka terlalu besar";
};

// ✅ Komponen PDF
const SuratBuktiGadaiPDF = ({ data }) => {
  const nasabah = data?.nasabah || {};
  const hp = data?.hp || {};

  return (
    <Document>
      <Page
        size={[DESIGN_WIDTH_PT, DESIGN_HEIGHT_PT]}
        style={{ position: "relative", padding: 0, fontFamily: "Roboto" }}
      >
        {/* Background */}
        <Image
          src={templateBg}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <SafeText style={{ position: "absolute", top: 68, left: 190, fontSize: 13, fontWeight: "bold" }}>
            {data.no_gadai}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 95, left: 100, fontSize: 7 }}>
            {data.no_nasabah}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 104, left: 100, fontSize: 7 }}>
            {nasabah.nik}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 111.5, left: 100, fontSize: 7 }}>
            {nasabah.nama_lengkap}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 120, left: 100, fontSize: 7 }}>
            {nasabah.alamat}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 130, left: 100, fontSize: 7 }}>
            {nasabah.no_hp}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 105, left: 303, fontSize: 7, fontWeight: "bold" }}>
            {data.tanggal_gadai}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 125, left: 303, fontSize: 7, fontWeight: "bold" }}>
            {data.jatuh_tempo}
          </SafeText>

          {/* Data HP */}
          <SafeText style={{ position: "absolute", top: 156, left: 93, fontSize: 7 }}>
            {hp.nama_barang}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 156, left: 178, fontSize: 7 }}>
            {hp.grade}/{hp.imei}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 167, left: 93, fontSize: 6 }}>
            {hp.merk}/ {hp.type_hp}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 178, left: 93, fontSize: 7 }}>
            {hp.ram}/{hp.rom}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 188, left: 93, fontSize: 7 }}>
            {hp.kelengkapan}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 195, left: 93, fontSize: 7 }}>
            {hp.kerusakan}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 167, left: 178, fontSize: 7 }}>
            {hp.warna}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 178, left: 178, fontSize: 7 }}>
            {hp.kunci_password}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 178, left: 178, fontSize: 7 }}>
            {hp.kunci_pin}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 178, left: 178, fontSize: 7 }}>
            {hp.kunci_pola}
          </SafeText>

          <SafeText style={{ position: "absolute", top: 145, left: 320, fontSize: 7, fontWeight: "bold" }}>
            {formatRupiah(data.taksiran)}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 156, left: 320, fontSize: 7, fontWeight: "bold" }}>
            {formatRupiah(data.uang_pinjaman)}
          </SafeText>
          <SafeText
            style={{
              position: "absolute",
              top: 169,
              left: 320,
              fontSize: 7,
              fontWeight: "bold",
              width: 60,
              lineHeight: 1.2,
            }}
          >
            {`${terbilang(data.uang_pinjaman)} Rupiah`}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 239, left: 60, fontSize: 9 }}>
            {nasabah.nama_lengkap}
          </SafeText>
          <SafeText style={{ position: "absolute", top: 110, left: 425, fontSize: 8, fontWeight: "bold" }}>
            {data.no_gadai}
          </SafeText>
          <SafeText
            style={{
              position: "absolute",
              top: 142,
              left: 425,
              fontSize: 6,
              width: 100,
              lineHeight: 1.2,
            }}
          >
            {`${hp.nama_barang}, ${hp.merk}/${hp.type_hp}, ${hp.ram}/${hp.rom}, ${hp.kelengkapan}/${hp.kerusakan}, ${hp.grade}/${hp.imei}, ${hp.warna}, ${hp.kunci_password}`}
          </SafeText>
        </View>
      </Page>
    </Document>
  );
};

const PrintSuratGadaiPage = () => {
  const { id } = useParams();
  const [dataGadai, setDataGadai] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handlePrintPDF = async () => {
    if (!dataGadai) return;
    const safeData = {
      ...dataGadai,
      nasabah: dataGadai.nasabah || {},
      hp: dataGadai.hp || {},
    };
    const blob = await pdf(<SuratBuktiGadaiPDF data={safeData} />).toBlob();
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
      <Box
        sx={{
          width: 600,
          height: 430,
          margin: "0 auto",
          border: "1px solid #ccc",
          position: "relative",
          backgroundImage: `url(${templateBg})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <Box sx={{ position: "absolute", top: 20, left: 20 }}>
          <Typography variant="body2">No. Gadai: {dataGadai.no_gadai}</Typography>
          <Typography variant="body2">
            Nama: {dataGadai.nasabah?.nama_lengkap}
          </Typography>
        </Box>
      </Box>

      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handlePrintPDF}>
          Cetak / Download PDF
        </Button>

        <Box mt={2}>
          <PDFDownloadLink
            document={<SuratBuktiGadaiPDF data={dataGadai} />}
            fileName={`Surat-Bukti-Gadai-${dataGadai.no_gadai}.pdf`}
          >
            {({ loading }) =>
              loading ? "Menyiapkan file..." : "Download Surat Bukti Gadai"
            }
          </PDFDownloadLink>
        </Box>
      </Box>
    </Box>
  );
};

export default PrintSuratGadaiPage;
