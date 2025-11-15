import React, { useEffect, useState, useContext } from "react";
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
import { AuthContext } from "AuthContex/AuthContext";


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


const cleanText = (text) => {
    if (!text) return "-";

    
    if (Array.isArray(text)) {
        text = text.join(", ");
    }

    
    if (typeof text === "string") {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) text = parsed.join(", ");
        } catch {
            
        }
    }

    return String(text)
        .replace(/\s{2,}/g, " ") 
        .replace(/\/\s*\//g, "/") 
        .trim();
};


const formatHpDetails = (hp) => {
    if (!hp) return "-";

    const data = [
        hp.nama_barang,
        // Pasangan Merk/Type
        [hp.merk, hp.type_hp].filter(Boolean).join("/"),
        // Pasangan Grade/IMEI
        [hp.grade, hp.imei].filter(Boolean).join("/"),
        // Pasangan RAM/ROM
        [hp.ram, hp.rom].filter(Boolean).join("/"),
        hp.warna,
        // Pasangan Kelengkapan/Kerusakan
        [hp.kelengkapan, hp.kerusakan].filter(Boolean).join("/"),
        hp.password
    ];

    // Gabungkan hanya item yang tidak kosong (setelah di-cleanText) dengan koma dan spasi
    return data.map(cleanText).filter(text => text !== "-").join(", ");
};

const SafeText = ({ children, style }) => {
    const content =
        children !== null && children !== undefined && children !== ""
            ? cleanText(children)
            : "-";
    return <Text style={style}>{content}</Text>;
};


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
        return (
            terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100)
        );
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

// ===== PDF TEMPLATE =====
const SuratBuktiGadaiPDF = ({ data }) => {
    const nasabah = data?.nasabah || {};
    const hp = data?.hp || {};

    return (
        <Document>
            <Page
                size={[187 * 2.83465, 263 * 2.83465]}
                style={{ position: "relative", fontFamily: "Roboto" }}
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

                {/* Overlay Data */}
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {/* Data Nasabah */}
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

                    {/* Tanggal */}
                    <SafeText style={{ position: "absolute", top: 105, left: 303, fontSize: 7, fontWeight: "bold" }}>
                        {data.tanggal_gadai}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 125, left: 303, fontSize: 7, fontWeight: "bold" }}>
                        {data.jatuh_tempo}
                    </SafeText>

                    {/* Barang HP (Kiri bawah) */}
                    <SafeText style={{ position: "absolute", top: 156, left: 93, fontSize: 7 }}>
                        {cleanText(hp.nama_barang)}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 156, left: 178, fontSize: 7 }}>
                        {`${cleanText(hp.grade)}/${cleanText(hp.imei)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 167, left: 93, fontSize: 6 }}>
                        {`${cleanText(hp.merk)}/${cleanText(hp.type_hp)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 167, left: 178, fontSize: 6 }}>
                        {`${cleanText(hp.warna)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 178, left: 178, fontSize: 6 }}>
                        {`${cleanText(hp.password)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 178, left: 93, fontSize: 7 }}>
                        {`${cleanText(hp.ram)}/${cleanText(hp.rom)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 188, left: 93, fontSize: 7 }}>
                        {cleanText(hp.kelengkapan)}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 195, left: 93, fontSize: 7 }}>
                        {cleanText(hp.kerusakan)}
                    </SafeText>

                    {/* Nilai Pinjaman */}
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


                    {/* Data Barcode / Kanan atas */}
                    <SafeText style={{ position: "absolute", top: 110, left: 430, fontSize: 8, fontWeight: "bold" }}>
                        {data.no_gadai}
                    </SafeText>
                    
                    {/* DETAIL HP KANAN (SUDAH DIPERBAIKI) */}
                    <SafeText 
                        style={{ 
                            position: "absolute", 
                            top: 145, 
                            left: 425, 
                            fontSize: 6, 
                            fontWeight: "bold", 
                            width: 100, 
                            lineHeight: 1.2, 
                        }}
                    >
                        {formatHpDetails(hp)} 
                    </SafeText>
                    
                    {/* Tanda tangan */}
                    <SafeText style={{ position: "absolute", top: 239, left: 46, fontSize: 7, }}>
                        {nasabah.nama_lengkap}
                    </SafeText>
                </View>
            </Page>
        </Document>
    );
};


const PrintSuratGadaiPage = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const userRole = (user?.role || "").toLowerCase();

    const [dataGadai, setDataGadai] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchData = async () => {
        setLoading(true);
        setErrorMsg("");

        try {
            let url = "";
            if (userRole === "checker") url = `/checker/detail-gadai/${id}`;
            else if (userRole === "petugas") url = `/petugas/detail-gadai/${id}`;
            else if (userRole === "hm") url = `/detail-gadai/${id}`;
            else url = `/detail-gadai/${id}`;

            const res = await axiosInstance.get(url);
            setDataGadai(res.data.data);
        } catch (err) {
            console.error("Gagal memuat data gadai:", err);
            setErrorMsg(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, userRole]);

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

    if (errorMsg)
        return (
            <Box textAlign="center" mt={4}>
                <Typography color="error">{errorMsg}</Typography>
                <Button onClick={fetchData} sx={{ mt: 2 }}>
                    Coba Lagi
                </Button>
            </Box>
        );

    if (!dataGadai) return <p>Data gadai tidak ditemukan.</p>;

    return (
        <Box sx={{ p: 3, textAlign: "center" }}>
            <Button variant="contained" color="primary" onClick={handlePrintPDF}>
                Cetak / Download Surat Bukti Gadai
            </Button>

            <Box mt={2}>
                <PDFDownloadLink
                    document={<SuratBuktiGadaiPDF data={dataGadai} />}
                    fileName={`Surat-Bukti-Gadai-${dataGadai.no_gadai}.pdf`}
                >
                    {({ loading }) =>
                        loading ? "Menyiapkan file..." : "⬇️ Download Surat Bukti Gadai"
                    }
                </PDFDownloadLink>
            </Box>
        </Box>
    );
};

export default PrintSuratGadaiPage;