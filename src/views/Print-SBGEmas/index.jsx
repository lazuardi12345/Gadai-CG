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
import templateBg from "assets/images/SBG-EMAS.jpg";

// Daftarkan font Roboto
Font.register({
    family: "Roboto",
    fonts: [
        { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf" },
        { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: "bold" },
    ],
});

// Konversi ukuran mm → pt
const DESIGN_WIDTH_MM = 187;
const DESIGN_HEIGHT_MM = 263;
const DESIGN_WIDTH_PT = DESIGN_WIDTH_MM * 2.83465;
const DESIGN_HEIGHT_PT = DESIGN_HEIGHT_MM * 2.83465;

const formatRupiah = (number) => {
    if (!number) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number);
};

const terbilang = (angka) => {
    const bilangan = [
        "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan",
        "Sepuluh", "Sebelas"
    ];
    angka = parseInt(angka, 10);
    if (angka < 12) return bilangan[angka];
    if (angka < 20) return terbilang(angka - 10) + " Belas";
    if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    if (angka < 200) return "Seratus " + terbilang(angka - 100);
    if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
    if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
    if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
    return "Angka terlalu besar";
};

const SuratBuktiGadaiPDF = ({ data }) => {
    const nasabah = data?.nasabah || '';
    const item = data?.perhiasan || data?.logam_mulia || data?.retro || '';

    const typeDisplay =
        item.type_retro || item.type_logam_mulia || item.type_logam_mulia || '';

    return (
        <Document>
            <Page
                size={[DESIGN_WIDTH_PT, DESIGN_HEIGHT_PT]}
                style={{ position: "relative", padding: 0, fontFamily: "Roboto" }}
            >
                {/* Background */}
                <Image
                    src={templateBg}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                />

                {/* Overlay Text */}
                <View style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                    <Text style={{ position: "absolute", top: 71, left: 190, fontSize: 12, fontWeight: "bold" }}>
                        {data.no_gadai}
                    </Text>
                    <Text style={{ position: "absolute", top: 98, left: 95, fontSize: 7 }}>
                        {data.no_nasabah}
                    </Text>
                    <Text style={{ position: "absolute", top: 106.5, left: 95, fontSize: 7 }}>
                        {nasabah.nik}
                    </Text>
                    <Text style={{ position: "absolute", top: 115, left: 95, fontSize: 7 }}>
                        {nasabah.nama_lengkap}
                    </Text>
                    <Text style={{ position: "absolute", top: 123, left: 95, fontSize: 7 }}>
                        {nasabah.alamat}
                    </Text>
                    <Text style={{ position: "absolute", top: 132, left: 95, fontSize: 7 }}>
                        {nasabah.no_hp}
                    </Text>

                    <Text style={{ position: "absolute", top: 109, left: 300, fontSize: 7, fontWeight: "bold" }}>
                        {data.tanggal_gadai}
                    </Text>
                    <Text style={{ position: "absolute", top: 130, left: 300, fontSize: 7, fontWeight: "bold" }}>
                        {data.jatuh_tempo}
                    </Text>
                    <Text style={{ position: "absolute", top: 158, left: 95, fontSize: 7 }}>
                        {item.nama_barang}
                    </Text>
                    {item.type_perhiasan && (
                        <Text style={{ position: "absolute", top: 168, left: 95, fontSize: 7 }}>
                            {item.type_perhiasan}
                        </Text>
                    )}
                    {item.type_logam_mulia && (
                        <Text style={{ position: "absolute", top: 168, left: 95, fontSize: 7 }}>
                            {item.type_logam_mulia}
                        </Text>
                    )}
                    {item.type_retro && (
                        <Text style={{ position: "absolute", top: 168, left: 95, fontSize: 7 }}>
                            {item.type_retro}
                        </Text>
                    )}               
                    <Text
                        style={{
                            position: "absolute",
                            top: 182,
                            left: 95,
                            fontSize: 7,
                            lineHeight: 1.2,
                        }}
                    >
                        {(Array.isArray(item.kelengkapan)
                            ? item.kelengkapan
                            : (item.kelengkapan || "").split(",").map(s => s.trim())
                        ).map((val, idx) => (
                            <Text key={idx}>
                                {val + "\n"}
                            </Text>
                        ))}
                    </Text>


                    <Text style={{ position: "absolute", top: 170, left: 193, fontSize: 7 }}>
                        {item.karat || "-"}/{item.berat || "-"}
                    </Text>
                    <Text style={{ position: "absolute", top: 158, left: 193, fontSize: 7 }}>
                        {item.kode_cap || "-"}
                    </Text>
                    <Text style={{ position: "absolute", top: 182, left: 193, fontSize: 7 }}>
                        {item.potongan_batu || "-"}
                    </Text>

                    {/* Taksiran & Pinjaman */}
                    <Text style={{ position: "absolute", top: 147, left: 321, fontSize: 7, fontWeight: "bold" }}>
                        {formatRupiah(data.taksiran)}
                    </Text>
                    <Text style={{ position: "absolute", top: 158, left: 321, fontSize: 7, fontWeight: "bold" }}>
                        {formatRupiah(data.uang_pinjaman)}
                    </Text>
                    <Text style={{ position: "absolute", top: 171, left: 321, fontSize: 7, fontWeight: "bold", width: 60, lineHeight: 1.2, }}>
                        {terbilang(data.uang_pinjaman)} Rupiah
                    </Text>

                    <Text style={{ position: "absolute", top: 241, left: 70, fontSize: 8, fontWeight: "bold", width: 100, lineHeight: 1.2, }}>
                        {nasabah.nama_lengkap}
                    </Text>
                    <Text style={{ position: "absolute", top: 110, left: 431, fontSize: 8, fontWeight: "bold" }}>
                        {data.no_gadai}
                    </Text>

                    <Text
                        style={{
                            position: "absolute",
                            top: 150,
                            left: 427,
                            fontSize: 6,
                            fontWeight: "bold",
                            width: 100,
                            lineHeight: 1.2,
                        }}
                    >
                        {item.nama_barang}, {typeDisplay}, {Array.isArray(item.kelengkapan) ? item.kelengkapan.join(", ") : item.kelengkapan || "-"}, {item.karat}/{item.berat}, {item.kode_cap}, {item.potongan_batu}.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

const PrintSuratGadaiEmasPage = () => {
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
        const blob = await pdf(<SuratBuktiGadaiPDF data={dataGadai} />).toBlob();
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
                    <Typography variant="body2">Nama: {dataGadai.nasabah?.nama_lengkap}</Typography>
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

export default PrintSuratGadaiEmasPage;
