import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box, Typography, } from "@mui/material";
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
import templateBg from "assets/images/SBG-HP-FIX.jpg";

import TtdManagerImg from 'assets/images/ttd.png'; 
import StempelImg from 'assets/images/stemple.png'; 

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
            // do nothing
        }
    }

    return String(text)
        .replace(/\s{2,}/g, " ")
        .replace(/\/\s*\//g, "/")
        .trim();
};

const formatHpDetails = (hp) => {
    if (!hp) return "-";

    const merk = hp.merk?.nama_merk || "";
    const typeHp = hp.type_hp?.nama_type || "";
    const grade = hp.grade_type || "";

    const kerusakan = (hp.kerusakan_list || []).map(k => k.nama_kerusakan).join(", ");
    const kelengkapan = (hp.kelengkapan_list || []).map(k => k.nama_kelengkapan).join(", ");

    const data = [
        hp.nama_barang,
        `${merk}/${typeHp}`,
        `${grade}/${hp.imei || ""}`,
        `${hp.ram || ""}/${hp.rom || ""}`,
        hp.warna || "",
        kelengkapan || "",
        kerusakan || "",
        hp.kunci_password || hp.kunci_pin || hp.kunci_pola || ""
    ];

    return data.map(cleanText).filter(text => text !== "").join(", ");
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

const SuratBuktiGadaiPDF = ({ data }) => {
    const nasabah = data?.nasabah || {};
    const hp = data?.hp || {};
    
    // Mengambil metadata dari BE yang sudah kita buat sebelumnya
    const { is_ttd_basah, signer_label, qr_code, qr_gudang } = data?.metadata || {};
    
    const isApproved = 
        data?.is_approved === true || 
        data?.is_approved === 1 || 
        data?.approval_status === 'approved';

    return (
        <Document>
            <Page
                size={[187 * 2.83465, 263 * 2.83465]}
                style={{ position: "relative", fontFamily: "Roboto" }}
            >
                {/* Background Template */}
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

                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {/* Header & Data Nasabah */}
                    <SafeText style={{ position: "absolute", top: 68, left: 190, fontSize: 13, fontWeight: "bold" }}>
                        {data.no_gadai}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 92, left: 86, fontSize: 7 }}>
                        {data.no_nasabah}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 102, left: 86, fontSize: 7 }}>
                        {nasabah.nik}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 110, left: 86, fontSize: 7 }}>
                        {nasabah.nama_lengkap}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 120, left: 86, fontSize: 7 }}>
                        {nasabah.alamat}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 137, left: 86, fontSize: 7 }}>
                        {nasabah.no_hp}
                    </SafeText>

                    {/* Tanggal & Jatuh Tempo */}
                    <SafeText style={{ position: "absolute", top: 105, left: 303, fontSize: 7, fontWeight: "bold" }}>
                        {data.tanggal_gadai}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 125, left: 303, fontSize: 7, fontWeight: "bold" }}>
                        {data.jatuh_tempo}
                    </SafeText>

                    {/* Detail Barang (HP) */}
                    <SafeText style={{ position: "absolute", top: 158, left: 90, fontSize: 7 }}>
                        {cleanText(hp.nama_barang)}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 158, left: 180, fontSize: 7 }}>
                        {`${cleanText(hp.grade_type)}/${cleanText(hp.imei)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 170, left: 90, fontSize: 6 }}>
                        {`${cleanText(hp.type_hp?.nama_type)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 171, left: 180, fontSize: 6 }}>
                        {`${cleanText(hp.warna)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 183, left: 180, fontSize: 6 }}>
                        {`${cleanText(hp.kunci_password || hp.kunci_pin || hp.kunci_pola)}`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 182, left: 90, fontSize: 7 }}>
                        {`${cleanText(hp.ram)}/${cleanText(hp.rom)} GB`}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 193, left: 90, fontSize: 7 }}>
                        {(hp.kelengkapan_list || []).map(k => k.nama_kelengkapan).join(", ")}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 201, left: 90, fontSize: 7 }}>
                        {(hp.kerusakan_list || []).map(k => k.nama_kerusakan).join(", ")}
                    </SafeText>

                    {/* Nominal Pinjaman */}
                    <SafeText style={{ position: "absolute", top: 148, left: 320, fontSize: 7, fontWeight: "bold" }}>
                        {formatRupiah(data.taksiran)}
                    </SafeText>
                    <SafeText style={{ position: "absolute", top: 160, left: 320, fontSize: 7, fontWeight: "bold" }}>
                        {formatRupiah(data.uang_pinjaman)}
                    </SafeText>
                    <SafeText
                        style={{
                            position: "absolute",
                            top: 173,
                            left: 320,
                            fontSize: 7,
                            fontWeight: "bold",
                            width: 60,
                            lineHeight: 1.2,
                        }}
                    >
                        {`${terbilang(data.uang_pinjaman)} Rupiah`}
                    </SafeText>

                    {/* Data Sisi Kanan (Copy) */}
                    <SafeText style={{ position: "absolute", top: 110, left: 430, fontSize: 8, fontWeight: "bold" }}>
                        {data.no_gadai}
                    </SafeText>
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

                    {/* Nama Nasabah Bawah */}
                    <SafeText style={{ position: "absolute", top: 239, left: 46, fontSize: 7 }}>
                        {nasabah.nama_lengkap}
                    </SafeText>

                    {/* Logika Approval & Tanda Tangan */}
                    {isApproved && (
                        <>
                            {/* QR Verifikasi SBG */}
                            {qr_code && (
                                <Image 
                                    src={qr_code} 
                                    style={{ position: "absolute", top: 302, left: 330, width: 50, height: 50 }} 
                                />
                            )}

                            {/* QR Gudang */}
                            {qr_gudang && (
                                <Image 
                                    src={qr_gudang} 
                                    style={{ position: "absolute", top: 42, left: 440, width: 65, height: 65 }} 
                                />
                            )}

                            {/* Tanda Tangan Manager (Hanya muncul jika BUKAN ttd basah) */}
                            {!is_ttd_basah && (
                                <Image 
                                    src={TtdManagerImg} 
                                    style={{ position: "absolute", top: 205, left: 295, width: 70, height: 55, zIndex: 1 }} 
                                />
                            )}

                            {/* Stempel (Selalu muncul baik ttd basah maupun digital) */}
                            <Image 
                                src={StempelImg} 
                                style={{ position: "absolute", top: 200, left: 270, width: 60, height: 60, zIndex: 2, opacity: 0.8 }} 
                            />

                            {/* Label Jabatan (Kepala Toko / Manager Operasional) */}
                            <SafeText style={{ position: "absolute", top: 240, left: 291, fontSize: 6, fontWeight: "bold", width: 83, textAlign: 'center' }}>
                                {`${signer_label} `}
                            </SafeText>
                        </>
                    )}
                </View>
            </Page>
        </Document>
    );
};

const PrintSuratGadaiPage = () => {
    const { id } = useParams();
    
    // 🔹 PERUBAHAN: Ambil role dari localStorage
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const userRole = (user?.role || "").toLowerCase();

    const [dataGadai, setDataGadai] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

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

    const handleAjukanSBG = async () => {
        if (!dataGadai) return;
        
        setSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            let submitUrl = "";
            if (userRole === "checker") {
                submitUrl = `/checker/detail-gadai/submit/${id}`;
            } else if (userRole === "petugas") {
                submitUrl = `/petugas/detail-gadai/submit/${id}`;
            } else {
                throw new Error("Role tidak memiliki akses untuk ajukan SBG");
            }

            const res = await axiosInstance.post(submitUrl);
            setSuccessMsg(res.data.message || "SBG berhasil diajukan untuk approval!");
            
            setTimeout(() => {
                fetchData();
            }, 1500);
        } catch (err) {
            console.error("Gagal mengajukan SBG:", err);
            setErrorMsg(err.response?.data?.message || "Gagal mengajukan SBG");
        } finally {
            setSubmitting(false);
        }
    };

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

    if (errorMsg && !dataGadai)
        return (
            <Box textAlign="center" mt={4}>
                <Typography color="error">{errorMsg}</Typography>
                <Button onClick={fetchData} sx={{ mt: 2 }}>
                    Coba Lagi
                </Button>
            </Box>
        );

    if (!dataGadai) return <p>Data gadai tidak ditemukan.</p>;

    const approvalStatus = dataGadai?.approval_status || 'draft';
const isApproved = dataGadai?.is_approved === true || 
                   dataGadai?.is_approved === 1 || 
                   dataGadai?.approval_status === 'approved';
const isPending = approvalStatus === 'pending';

// LOGIKA BARU: Tambahkan status 'selesai' di sini
const canSubmit = (userRole === 'checker' || userRole === 'petugas') 
                  && (dataGadai?.status === 'proses' || dataGadai?.status === 'selesai') 
                  && approvalStatus === 'draft';
return (
        <Box sx={{ 
            p: { xs: 2, md: 4 }, 
            display: 'flex', 
            justifyContent: 'center', 
            bgcolor: '#f4f6f8', 
            minHeight: '100vh' 
        }}>
            <Box sx={{ 
                maxWidth: 500, 
                width: '100%', 
                bgcolor: 'white', 
                borderRadius: 4, 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                overflow: 'hidden'
            }}>
                {/* Header Elegan */}
                <Box sx={{ 
                    bgcolor: isApproved ? '#2e7d32' : '#1976d2', 
                    p: 3, 
                    color: 'white', 
                    textAlign: 'center' 
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                        SURAT BUKTI GADAI
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {dataGadai.no_gadai}
                    </Typography>
                </Box>

                <Box sx={{ p: 4 }}>
                    {/* Status Section */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: 4,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#f8f9fa',
                        border: '1px solid #edf2f7'
                    }}>
                        <Box textAlign="left">
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                STATUS TRANSAKSI
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2d3748' }}>
                                {dataGadai.status.toUpperCase()}
                            </Typography>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                STATUS APPROVAL
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                fontWeight: 'bold', 
                                color: isApproved ? '#2e7d32' : (isPending ? '#ed8936' : '#718096') 
                            }}>
                                {approvalStatus.toUpperCase()}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Action Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        
                        {canSubmit && (
                            <Button 
                                variant="contained" 
                                color="warning"
                                fullWidth
                                disableElevation
                                sx={{ 
                                    py: 1.5, 
                                    borderRadius: 2, 
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(237, 137, 54, 0.2)'
                                }}
                                onClick={handleAjukanSBG}
                                disabled={submitting}
                            >
                                {submitting ? <CircularProgress size={24} color="inherit" /> : "Ajukan ACC Online"}
                            </Button>
                        )}

                        {isPending && (
                            <Box sx={{ 
                                p: 2, 
                                bgcolor: '#fffaf0', 
                                borderRadius: 2, 
                                border: '1px solid #feebc8',
                                textAlign: 'center'
                            }}>
                                <Typography variant="body2" sx={{ color: '#c05621', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    ⏳ Menunggu Verifikasi Manager
                                </Typography>
                            </Box>
                        )}

                        {/* Print Button Section */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: '#718096', textAlign: 'center', fontWeight: 500 }}>
                                {isApproved ? "DOKUMEN SUDAH TERVERIFIKASI" : "DOKUMEN DRAFT"}
                            </Typography>
                            
                            <Button 
                                variant="contained" 
                                color={isApproved ? "success" : "inherit"}
                                onClick={handlePrintPDF} 
                                fullWidth
                                disableElevation
                                sx={{ 
                                    py: 2, 
                                    borderRadius: 2, 
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    bgcolor: isApproved ? '#2e7d32' : '#e2e8f0',
                                    color: isApproved ? 'white' : '#4a5568',
                                    '&:hover': {
                                        bgcolor: isApproved ? '#1b5e20' : '#cbd5e0',
                                    }
                                }}
                            >
                                {isApproved ? "Cetak SBG Resmi (E-Signature)" : "Cetak Draft (TTD Manual)"}
                            </Button>
                        </Box>

                        {successMsg && (
                            <Typography variant="caption" sx={{ mt: 1, color: '#2e7d32', textAlign: 'center', fontWeight: 'bold' }}>
                                ✅ {successMsg}
                            </Typography>
                        )}
                        
                        {errorMsg && (
                            <Typography variant="caption" sx={{ mt: 1, color: '#e53e3e', textAlign: 'center', fontWeight: 'bold' }}>
                                ⚠️ {errorMsg}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Footer Tipis */}
                <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #edf2f7' }}>
                    <Typography variant="caption" color="textDisabled">
                        PT Sentra Gadai Indonesia System
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default PrintSuratGadaiPage;