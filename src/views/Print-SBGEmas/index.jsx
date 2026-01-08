import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box, Typography, Alert } from "@mui/material";
import {
    Document,
    Page,
    Text,
    View,
    Image,
    Font,
    pdf,
} from "@react-pdf/renderer";

// Assets
import templateBg from "assets/images/SBG-EMAS.jpg";
import TtdManagerImg from 'assets/images/ttd.png'; 
import StempelImg from 'assets/images/stemple.png'; 

// === Font Setup ===
Font.register({
    family: "Roboto",
    fonts: [
        { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf" },
        { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: "bold" },
    ],
});

// === Constants & Helpers ===
const DESIGN_WIDTH_PT = 187 * 2.83465;
const DESIGN_HEIGHT_PT = 263 * 2.83465;

const toText = (value) => {
    if (!value) return "-";
    if (Array.isArray(value)) return value.map(v => typeof v === "object" ? (v.nama_kelengkapan || v.nama) : v).join(", ");
    return String(value);
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
    const bilangan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    angka = parseInt(angka, 10);
    if (isNaN(angka)) return "-";
    if (angka < 12) return bilangan[angka];
    if (angka < 20) return terbilang(angka - 10) + " Belas";
    if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    if (angka < 200) return "Seratus " + terbilang(angka - 100);
    if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
    if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
    return "Angka terlalu besar";
};

// Gabungkan detail emas untuk potongan kecil di sebelah kanan
const formatEmasDetails = (item, typeName) => {
    if (!item) return "-";
    const kelengkapan = toText(item.kelengkapan_emas || item.kelengkapan);
    return [
        item.nama_barang,
        typeName,
        `Karat: ${item.karat}`,
        `Berat: ${item.berat}gr`,
        kelengkapan
    ].filter(Boolean).join(", ");
};

// === PDF Component ===
const SuratBuktiGadaiPDF = ({ data }) => {
    const nasabah = data?.nasabah || {};
    const item = data?.perhiasan || data?.logam_mulia || data?.retro || {};
    const typeDisplay = data?.type?.nama_type || "-";
    
    const isApproved = 
        data?.is_approved === true || 
        data?.is_approved === 1 || 
        data?.approval_status === 'approved';

    return (
        <Document>
            <Page size={[DESIGN_WIDTH_PT, DESIGN_HEIGHT_PT]} style={{ position: "relative", padding: 0, fontFamily: "Roboto" }}>
                <Image src={templateBg} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
                
                <View style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                    <Text style={{ position: "absolute", top: 69, left: 183, fontSize: 12, fontWeight: "bold" }}>{data.no_gadai}</Text>
                    <Text style={{ position: "absolute", top: 92, left: 85, fontSize: 7 }}>{data.no_nasabah}</Text>
                    <Text style={{ position: "absolute", top: 102, left: 85, fontSize: 7 }}>{nasabah.nik}</Text>
                    <Text style={{ position: "absolute", top: 110, left: 85, fontSize: 7 }}>{nasabah.nama_lengkap}</Text>
                    <Text style={{ position: "absolute", top: 120, left: 85, fontSize: 7 }}>{nasabah.alamat}</Text>
                    <Text style={{ position: "absolute", top: 137, left: 85, fontSize: 7 }}>{nasabah.no_hp}</Text>

                    <Text style={{ position: "absolute", top: 109, left: 300, fontSize: 7, fontWeight: "bold" }}>{data.tanggal_gadai}</Text>
                    <Text style={{ position: "absolute", top: 130, left: 300, fontSize: 7, fontWeight: "bold" }}>{data.jatuh_tempo}</Text>

                    <Text style={{ position: "absolute", top: 161, left: 85, fontSize: 7 }}>{toText(item.nama_barang)}</Text>
                    <Text style={{ position: "absolute", top: 174, left: 85, fontSize: 7 }}>{toText(typeDisplay)}</Text>
                    <Text style={{ position: "absolute", top: 185, left: 85, fontSize: 7 }}>{toText(item.kelengkapan_emas || item.kelengkapan)}</Text>
                    <Text style={{ position: "absolute", top: 173, left: 185, fontSize: 7 }}>{toText(item.karat)}/{toText(item.berat)}</Text>
                    <Text style={{ position: "absolute", top: 160, left: 185, fontSize: 7 }}>{toText(item.kode_cap)}</Text>
                    <Text style={{ position: "absolute", top: 185, left: 185, fontSize: 7 }}>{toText(item.potongan_batu)}</Text>

                    <Text style={{ position: "absolute", top: 147, left: 321, fontSize: 7, fontWeight: "bold" }}>{formatRupiah(data.taksiran)}</Text>
                    <Text style={{ position: "absolute", top: 158, left: 321, fontSize: 7, fontWeight: "bold" }}>{formatRupiah(data.uang_pinjaman)}</Text>
                    <Text style={{ position: "absolute", top: 171, left: 321, fontSize: 7, fontWeight: "bold", width: 60, lineHeight: 1.2 }}>{terbilang(data.uang_pinjaman)} Rupiah</Text>

                    <Text style={{ position: "absolute", top: 237, left: 50, fontSize: 8, fontWeight: "bold" }}>{nasabah.nama_lengkap}</Text>
                    <Text style={{ position: "absolute", top: 110, left: 431, fontSize: 8, fontWeight: "bold" }}>{data.no_gadai}</Text>
                    <Text style={{ position: "absolute", top: 150, left: 427, fontSize: 6, fontWeight: "bold", width: 100, lineHeight: 1.2 }}>{formatEmasDetails(item, typeDisplay)}</Text>

                    {isApproved && (
                        <>
                            {data.metadata?.qr_code && (
                                <Image 
                                    src={data.metadata.qr_code} 
                                    style={{ position: "absolute", top: 302, left: 330, width: 50, height: 50 }} 
                                />
                            )}
                            <Image 
                                    src={data.metadata?.qr_code} 
                                    style={{ position: "absolute", top: 42, left: 440, width: 65, height: 65 }} 
                                />
                            <Image 
                                src={TtdManagerImg} 
                                style={{ position: "absolute", top: 205, left: 295, width: 70, height: 55, zIndex: 1 }} 
                            />
                            <Image 
                                src={StempelImg} 
                                style={{ position: "absolute", top: 200, left: 270, width: 60, height: 60, zIndex: 2, opacity: 0.8 }} 
                            />
                        </>
                    )}
                </View>
            </Page>
        </Document>
    );
};

// === Main Page Component ===
const PrintSuratGadaiEmasPage = () => {
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const userRole = (user?.role || "").toLowerCase();

    const [dataGadai, setDataGadai] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = (userRole === "checker") ? `/checker/detail-gadai/${id}` : 
                      (userRole === "petugas") ? `/petugas/detail-gadai/${id}` : `/detail-gadai/${id}`;
            const res = await axiosInstance.get(url);
            setDataGadai(res.data.data);
        } catch (err) { setErrorMsg("Gagal ambil data"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [id, userRole]);

    const handleAjukan = async () => {
        setSubmitting(true);
        try {
            const url = userRole === "checker" ? `/checker/detail-gadai/submit/${id}` : `/petugas/detail-gadai/submit/${id}`;
            await axiosInstance.post(url);
            alert("SBG Berhasil diajukan ke HM!");
            fetchData();
        } catch (err) { alert("Gagal mengajukan"); }
        finally { setSubmitting(false); }
    };

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            await axiosInstance.post(`/detail-gadai/approve/${id}`);
            alert("SBG Disetujui oleh HM!");
            fetchData();
        } catch (err) { alert("Gagal menyetujui"); }
        finally { setSubmitting(false); }
    };

    const handlePrintPDF = async () => {
        const blob = await pdf(<SuratBuktiGadaiPDF data={dataGadai} />).toBlob();
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.contentWindow.print();
    };

    if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
    if (!dataGadai) return <Typography align="center">Data tidak ditemukan</Typography>;

    
    const approvalStatus = dataGadai?.approval_status || 'draft';
    const isApproved = approvalStatus === 'approved';
    const isPending = approvalStatus === 'pending';

    const canSubmit = (userRole === 'petugas' || userRole === 'checker') && approvalStatus === 'draft';
    const canApprove = (userRole === 'hm') && isPending;

    return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ maxWidth: 500, width: '100%', bgcolor: 'white', borderRadius: 4, boxShadow: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: isApproved ? '#2e7d32' : '#1976d2', color: 'white', textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">SURAT BUKTI GADAI EMAS</Typography>
                    <Typography variant="caption">{dataGadai.no_gadai}</Typography>
                </Box>

                <Box sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="body2">Status: <strong>{dataGadai.status.toUpperCase()}</strong></Typography>
                        <Typography variant="body2">Approval: <strong>{approvalStatus.toUpperCase()}</strong></Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {canSubmit && (
                            <Button variant="contained" color="warning" fullWidth onClick={handleAjukan} disabled={submitting}>
                                {submitting ? <CircularProgress size={20} /> : "AJUKAN KE HM"}
                            </Button>
                        )}

                        {canApprove && (
                            <Button variant="contained" color="success" fullWidth onClick={handleApprove} disabled={submitting}>
                                {submitting ? <CircularProgress size={20} /> : "SETUJUI SBG (HM)"}
                            </Button>
                        )}

                        {isPending && userRole !== 'hm' && (
                            <Alert severity="info">Menunggu persetujuan HM...</Alert>
                        )}

                        <Button 
                            variant="contained" fullWidth onClick={handlePrintPDF}
                            sx={{ py: 1.5, bgcolor: isApproved ? '#2e7d32' : '#4a5568' }}
                        >
                            {isApproved ? "CETAK SBG RESMI (TTD DIGITAL)" : "CETAK DRAFT (TTD MANUAL)"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default PrintSuratGadaiEmasPage;