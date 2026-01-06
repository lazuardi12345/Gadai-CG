import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, Alert
} from '@mui/material';
import { Print, Refresh, Send } from '@mui/icons-material'; 
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";

import KopSuratImg from 'assets/images/Kop SUrat.png'; 
import TtdManagerImg from 'assets/images/ttd.png'; 
import StempelImg from 'assets/images/stemple.png';     

const LaporanHarianChecker = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); 
  const [dataLunas, setDataLunas] = useState(null); 
  const [dataPerpanjangan, setDataPerpanjangan] = useState(null); 
  const [dataLelang, setDataLelang] = useState(null);
  const [dataBrankas, setDataBrankas] = useState(null); 
  const [error, setError] = useState(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // --- FUNGSI AJUKAN: SEKALI KLIK UNTUK SEMUA (HAL 2-5) ---
  const handleAjukan = async () => {
    if (!window.confirm("Ajukan semua laporan audit (Hal 2-5) ke Manager?")) return;
    
    setSubmitting(true);
    try {
      // Menembak endpoint khusus checker untuk bulk submit
      const res = await axiosInstance.post('/checker/report/submit', {
        report_date: tanggal
      });

      if (res.data.success) {
        alert(res.data.message || "Berhasil diajukan!");
        fetchSemuaLaporan(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengajukan laporan.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTanggalIndo = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
  };

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const renderSignature = (pageData) => {
  const meta = pageData?.metadata;
  const isApproved = meta?.is_approved || false;
  const checkerName = meta?.checker_name || user?.name || 'Checker';
  const qrData = meta?.qr_code;
  const docId = meta?.doc_id;

  const waktuSekarang = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).replace(/\./g, ':');

  return (
    <Box className="signature-area" sx={{ mt: 'auto', pt: 2, position: 'relative' }}>
      
      <Grid container sx={{ textAlign: 'center', alignItems: 'flex-end', mb: 3 }}>
        {/* KOLOM CHECKER */}
        <Grid item xs={4}>
          <Typography sx={{ fontSize: '0.7rem', mb: 6 }}>Dibuat Oleh (Checker),</Typography>
          <Box sx={{ borderTop: '1.5px solid #000', mx: 2, pt: 0.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{checkerName}</Typography>
          </Box>
        </Grid>

        {/* KOLOM QR CODE */}
        <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 0.5 }}>
          {qrData ? (
            <>
              <img src={qrData} alt="QR Verification" style={{ width: '70px', height: '70px' }} />
              <Typography sx={{ fontSize: '0.55rem', mt: 0.5, fontWeight: 'bold', color: '#555', fontFamily: 'monospace' }}>
                {docId}
              </Typography>
            </>
          ) : (
            <Box sx={{ height: '75px', display: 'flex', alignItems: 'center' }}>
               <Typography variant="caption" color="error" sx={{ fontSize: '0.5rem', fontWeight: 'bold' }}>QR VALIDASI<br/>MENUNGGU ACC</Typography>
            </Box>
          )}
        </Grid>

        {/* KOLOM MANAGER */}
        <Grid item xs={4}>
          <Typography sx={{ fontSize: '0.7rem', mb: 6 }}>Diketahui Oleh (Manajer),</Typography>
          <Box sx={{ position: 'relative', mx: 2 }}>
              {isApproved && (
                <>
                  <Box component="img" src={TtdManagerImg} sx={{ position: 'absolute', width: '100px', bottom: '5px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }} />
                  <Box component="img" src={StempelImg} sx={{ position: 'absolute', width: '140px', bottom: '-1px', left: '-10px', zIndex: 4, opacity: 0.8 }} />
                </>
              )}
              <Box sx={{ borderTop: '1.5px solid #000', pt: 0.5, position: 'relative', zIndex: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>MANAGER SGI</Typography>
                {!isApproved && (
                  <Typography sx={{ fontSize: '0.5rem', color: 'red', fontWeight: 'bold', position: 'absolute', top: -15, width: '100%' }}>
                    (BELUM DI-ACC)
                  </Typography>
                )}
              </Box>
          </Box>
        </Grid>
      </Grid>

      {/* --- KETERANGAN SISTEM DI POJOK KANAN BAWAH --- */}
      <Box sx={{ 
        textAlign: 'right', 
        mt: 1, 
        pr: 1,
        borderTop: '0.5px solid #eee',
        pt: 0.5
      }}>
        <Typography sx={{ fontSize: '0.5rem', color: '#777', fontStyle: 'italic', lineHeight: 1.2 }}>
          * Laporan ini dicetak secara sistem komputerisasi pada {waktuSekarang} WIB
        </Typography>
        <Typography sx={{ fontSize: '0.5rem', color: isApproved ? 'green' : '#777', fontWeight: 'bold', lineHeight: 1.2 }}>
          * Validasi Digital: {isApproved ? 'TERVERIFIKASI ASLI' : 'DRAFT / BELUM DIVALIDASI'}
        </Typography>
      </Box>

    </Box>
  );
};

  const fetchSemuaLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resLunas, resPerpanjangan, resLelang, resBrankas] = await Promise.all([
        axiosInstance.get('/checker/harian/cetak-serah-terima', { params: { tanggal } }),
        axiosInstance.get('/checker/cetak-perpanjangan', { params: { tanggal } }),
        axiosInstance.get('/checker/cetak-lelang', { params: { tanggal } }),
        axiosInstance.get('/checker/cetak-brankas', { params: { tanggal } })
      ]);

      if (resLunas.data.success) setDataLunas(resLunas.data);
      if (resPerpanjangan.data.success) setDataPerpanjangan(resPerpanjangan.data);
      if (resLelang.data.success) setDataLelang(resLelang.data);
      if (resBrankas.data.success) setDataBrankas(resBrankas.data);
    } catch (err) { 
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi ke server.");
    } finally { setLoading(false); }
  }, [tanggal]);

  useEffect(() => { if (userRole === 'checker') fetchSemuaLaporan(); }, [fetchSemuaLaporan, userRole]);

const paperStyle = { 
    width: '210mm', 
    height: '297mm', 
    margin: '0 auto', 
    p: '42mm 15mm 15mm 15mm', 
    position: 'relative',
    display: 'flex', 
    flexDirection: 'column', 
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    backgroundImage: `url("${KopSuratImg}")`, 
    backgroundSize: '100% auto', 
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top center', 
    bgcolor: '#fff', 
    boxSizing: 'border-box', 
    overflow: 'hidden', 
    pageBreakAfter: 'always'
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#546e7a', minHeight: '100vh' }}>
      
      <Card sx={{ p: 2, mb: 3, borderRadius: '12px' }} className="no-print">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchSemuaLaporan} disabled={loading} color="secondary">Refresh</Button>
            
            <Button 
                variant="contained" 
                startIcon={<Send />} 
                onClick={handleAjukan} 
                disabled={submitting || loading} 
                color="warning"
                sx={{ fontWeight: 'bold' }}
            >
                {submitting ? "Mengajukan..." : "Ajukan Approval (Hal 2-5)"}
            </Button>

            <Button 
              variant="contained" 
              startIcon={<Print />} 
              onClick={() => window.print()} 
              disabled={loading} 
              color="primary"
            >
              Cetak PDF
            </Button>
          </Stack>
          <Chip label="MODE: CHECKER (HAL 2-5)" color="primary" sx={{fontWeight: 'bold'}} />
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, mx: 'auto', maxWidth: '210mm' }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#fff', mb: 2 }} />
            <Typography sx={{ color: '#fff' }}>Menyusun Laporan Audit...</Typography>
        </Box>
      ) : (
        <Box className="print-container" sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          
          {/* PAGE 2: LAPORAN SERAH TERIMA BARANG (LUNAS) */}
<Paper className="print-page" sx={paperStyle}>
  <Box sx={{ textAlign: 'center', mb: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline', color: '#000', fontSize: '1.1rem' }}>
      LAPORAN SERAH TERIMA BARANG (LUNAS)
    </Typography>
    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
      Tanggal: {dataLunas?.metadata?.tanggal_laporan || formatTanggalIndo(tanggal)}
    </Typography>
  </Box>

  <TableContainer sx={{ flex: 1 }}>
    <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', py: 0.5, px: 0.8, fontSize: '0.65rem' } }}>
      <TableHead>
        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
          <TableCell align="center" width="30">NO</TableCell>
          <TableCell width="140">NASABAH / NO GADAI</TableCell>
          <TableCell>BARANG & DETAIL SPESIFIKASI</TableCell>
          <TableCell align="right" width="120">NOMINAL LUNAS</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {dataLunas?.data?.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell align="center">{idx + 1}</TableCell>
            <TableCell>
              <b>{item.nasabah}</b><br/>
              <small>{item.no_gadai}</small>
            </TableCell>
            <TableCell>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                {item.nama_barang}
              </Typography>
              {/* Detail spesifik (Emas: Karat & Kode Cap | HP: Tipe) */}
              <Typography sx={{ fontSize: '0.6rem', color: '#444', whiteSpace: 'pre-line' }}>
                {item.detail_spesifik}
              </Typography>
              {/* Menampilkan Kelengkapan jika ada */}
              {item.kelengkapan && item.kelengkapan.length > 0 && (
                <Typography sx={{ fontSize: '0.55rem', fontStyle: 'italic', mt: 0.5 }}>
                  Kelengkapan: {item.kelengkapan.join(', ')}
                </Typography>
              )}
            </TableCell>
            <TableCell align="right" width="120" sx={{ fontWeight: 'bold' }}>
              {formatRupiah(item.nominal_lunas)}
            </TableCell>
          </TableRow>
        ))}

        {/* BARIS GRAND TOTAL */}
        <TableRow sx={{ bgcolor: '#f9f9f9' }}>
          <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
            TOTAL PELUNASAN ({dataLunas?.metadata?.total_item || 0} ITEM):
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '2px solid #000', bgcolor: '#fff' }}>
            {formatRupiah(dataLunas?.metadata?.grand_total_lunas)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Box sx={{ mt: 2, px: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', lineHeight: 1.4, textAlign: 'justify' }}>
        Bahwa pada hari ini <b>{dataLunas?.metadata?.tanggal_laporan || formatTanggalIndo(tanggal)}</b>, barang-barang jaminan dengan rincian di atas telah diserahkan kembali kepada nasabah dalam kondisi baik dan lengkap sehubungan dengan pelunasan pinjaman yang telah dilakukan sesuai dengan record <b>ID: {dataLunas?.metadata?.doc_id || '-'}</b>.
      </Typography>
    </Box>
  </TableContainer>

  {/* Tanda Tangan (Biasanya menyertakan kolom Nasabah dan Petugas) */}
  {renderSignature(dataLunas)}
</Paper>

          {/* PAGE 3: LAPORAN PERPANJANGAN */}
          <Paper className="print-page" sx={paperStyle}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline', color: '#000', fontSize: '1.1rem' }}>
                LAPORAN PERPANJANGAN TEMPO GADAI
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Tanggal: {formatTanggalIndo(tanggal)}</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', py: 0.5, px: 0.8, fontSize: '0.65rem' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                    <TableCell align="center" width="30">NO</TableCell>
                    <TableCell width="130">NASABAH / NO GADAI</TableCell>
                    <TableCell>BARANG & DETAIL</TableCell>
                    <TableCell align="center" width="85">JT LAMA</TableCell>
                    <TableCell align="center" width="85">JT BARU</TableCell>
                    <TableCell align="right" width="110">NOMINAL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataPerpanjangan?.data?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell><b>{item.nasabah}</b><br/><small>{item.no_gadai}</small></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{item.barang}</Typography>
                        <Typography sx={{ fontSize: '0.6rem' }}>{item.detail}</Typography>
                      </TableCell>
                      <TableCell align="center">{item.jt_lama}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: 'blue' }}>{item.jt_baru}</TableCell>
                      <TableCell align="right">{formatRupiah(item.nominal_pembayaran)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>TOTAL PERPANJANGAN (DEBET):</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '2px solid #000' }}>
                      {formatRupiah(dataPerpanjangan?.metadata?.total_dana_masuk)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {renderSignature(dataPerpanjangan)}
          </Paper>

          {/* PAGE 4: LAPORAN PELELANGAN & PROFIT LELANG */}
          <Paper className="print-page" sx={paperStyle}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline', color: '#000', fontSize: '1.1rem' }}>
                LAPORAN PELELANGAN & PROFIT LELANG
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Tanggal: {dataLelang?.metadata?.tanggal_laporan || formatTanggalIndo(tanggal)}
              </Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', py: 0.5, px: 0.8, fontSize: '0.6rem' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                    <TableCell align="center" width="30">NO</TableCell>
                    <TableCell width="130">NASABAH / NO GADAI</TableCell>
                    <TableCell>BARANG & DETAIL</TableCell>
                    <TableCell align="center" width="70">STATUS</TableCell>
                    <TableCell align="right" width="90">HUTANG POKOK</TableCell>
                    <TableCell align="right" width="90">HASIL LELANG</TableCell>
                    <TableCell align="right" width="80">PROFIT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataLelang?.data?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell>
                        <b>{item.nasabah}</b><br />
                        <small>{item.no_gadai}</small>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                          {item.barang}
                        </Typography>
                        {/* whiteSpace pre-line penting supaya format \n dari BE (emas) terbaca turun ke bawah */}
                        <Typography sx={{ fontSize: '0.55rem', whiteSpace: 'pre-line', color: '#444' }}>
                          {item.detail_barang}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ 
                          fontSize: '0.55rem', 
                          fontWeight: 'bold', 
                          color: item.status === 'LUNAS' ? 'blue' : 'orange' 
                        }}>
                          {item.status}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatRupiah(item.hutang_nasabah)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatRupiah(item.nominal_masuk)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'green', fontWeight: 'bold' }}>
                        {formatRupiah(item.keuntungan)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* BARIS GRAND TOTAL */}
                  <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>
                      GRAND TOTAL ({dataLelang?.metadata?.jumlah_barang || 0} ITEM):
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#e8f5e9', border: '1.5px solid #000', fontSize: '0.7rem' }}>
                      {formatRupiah(dataLelang?.metadata?.grand_total_masuk)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'green', border: '1.5px solid #000', fontSize: '0.7rem' }}>
                      {formatRupiah(dataLelang?.metadata?.grand_total_keuntungan)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {renderSignature(dataLelang)}
          </Paper>

{/* PAGE 5: LAPORAN PERTANGGUNGJAWABAN BRANKAS */}
<Paper className="print-page" sx={paperStyle}>
  <Box sx={{ textAlign: 'center', mb: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline', color: '#000', fontSize: '1.1rem' }}>
      LAPORAN PERTANGGUNGJAWABAN BRANKAS
    </Typography>
    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Tanggal: {formatTanggalIndo(tanggal)}</Typography>
  </Box>
  
  <Box sx={{ mb: 2, p: 1, border: '1.5px solid #000' }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold', mb: 1, textDecoration: 'underline' }}>RINGKASAN MUTASI FISIK:</Typography>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
      <tbody>
        <tr>
          <td width="20%">Saldo Awal</td>
          <td width="25%" style={{ textAlign: 'right', fontWeight: 'bold' }}>
            {formatRupiah(dataBrankas?.summary_brankas?.saldo_awal)}
          </td>
          <td style={{ width: '10%' }}></td>
          <td width="20%">Total Mutasi Keluar</td>
          <td width="25%" style={{ textAlign: 'right', fontWeight: 'bold', color: 'red' }}>
            {/* Jika total_kredit di backend 0, ambil dari hitungan manual data_mutasi */}
            {formatRupiah(dataBrankas?.summary_brankas?.total_kredit || 
              dataBrankas?.data_mutasi?.reduce((acc, curr) => acc + parseFloat(curr.pengeluaran || 0), 0))}
          </td>
        </tr>
        <tr>
          <td>Total Mutasi Masuk</td>
          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'blue' }}>
            {/* Jika total_debet di backend 0, hitung manual agar UI tidak kosong */}
            {formatRupiah(dataBrankas?.summary_brankas?.total_debet || 
              dataBrankas?.data_mutasi?.reduce((acc, curr) => acc + parseFloat(curr.pemasukan || 0), 0))}
          </td>
          <td></td>
          <td style={{ fontWeight: 'bold', bgcolor: '#eee' }}>SALDO AKHIR BRANKAS</td>
          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'blue', fontSize: '0.8rem', bgcolor: '#eee' }}>
            {dataBrankas?.summary_brankas?.formatted_saldo_akhir || formatRupiah(dataBrankas?.summary_brankas?.saldo_akhir)}
          </td>
        </tr>
      </tbody>
    </table>
  </Box>

  <TableContainer sx={{ flex: 1 }}>
    <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', py: 0.4, px: 0.8, fontSize: '0.6rem' } }}>
      <TableHead sx={{ bgcolor: '#eee' }}>
        <TableRow>
          <TableCell align="center" width="40">JAM</TableCell>
          <TableCell>KETERANGAN TRANSAKSI</TableCell>
          <TableCell align="right" width="100">MASUK (DR)</TableCell>
          <TableCell align="right" width="100">KELUAR (CR)</TableCell>
          <TableCell align="center" width="70">STATUS</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {dataBrankas?.data_mutasi?.map((row, idx) => (
          <TableRow key={idx}>
            <TableCell align="center">
              {row.created_at ? row.created_at.split(' ')[1].substring(0, 5) : '-'}
            </TableCell>
            <TableCell>{row.deskripsi}</TableCell>
            <TableCell align="right">
              {parseFloat(row.pemasukan) > 0 ? formatRupiah(row.pemasukan) : '-'}
            </TableCell>
            <TableCell align="right">
              {parseFloat(row.pengeluaran) > 0 ? formatRupiah(row.pengeluaran) : '-'}
            </TableCell>
            <TableCell align="center">
              <Typography sx={{ fontSize: '0.5rem', fontWeight: 'bold', color: row.status_validasi === 'tervalidasi' ? 'green' : 'orange' }}>
                {row.status_validasi?.toUpperCase()}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
        {/* BARIS GRAND TOTAL MUTASI (BAGIAN BAWAH TABEL) */}
        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
          <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>GRAND TOTAL MUTASI:</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: 'blue' }}>
            {formatRupiah(dataBrankas?.data_mutasi?.reduce((acc, curr) => acc + parseFloat(curr.pemasukan || 0), 0))}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: 'red' }}>
            {formatRupiah(dataBrankas?.data_mutasi?.reduce((acc, curr) => acc + parseFloat(curr.pengeluaran || 0), 0))}
          </TableCell>
          <TableCell sx={{ bgcolor: '#fff' }}></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
  {renderSignature(dataBrankas)}
</Paper>

        </Box>
      )}

    <style>
      {`
        @media screen {
          .print-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
          }
        }

        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            width: 210mm !important;
            height: 297mm !important;
            background: #fff !important;
          }

          body * {
            visibility: hidden;
          }

          .print-container, .print-page, .print-page * {
            visibility: visible;
          }

          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }

          .print-page {
            position: relative !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 42mm 15mm 20mm 15mm !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            background-image: url("${KopSuratImg}") !important;
            background-size: 100% auto !important;
            background-repeat: no-repeat !important;
            background-position: top center !important;
          }

          /* Agar tabel tidak terpotong di tengah */
          .MuiTableContainer-root {
            overflow: visible !important;
          }

          .MuiTable-root {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important; /* Kunci agar lebar kolom konsisten */
          }

          .MuiTableCell-root {
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            font-size: 7.5pt !important; /* Ukuran font dioptimalkan */
            line-height: 1.2 !important;
          }

          /* --- KHUSUS PAGE 5 (BRANKAS) --- */
          /* Atur lebar kolom agar nominal Rp tidak numpuk */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(1) { width: 45px !important; }  /* JAM */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(3) { width: 105px !important; } /* MASUK */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(4) { width: 105px !important; } /* KELUAR */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(5) { width: 75px !important; }  /* STATUS */

          /* Style untuk baris Grand Total di print */
          tr.MuiTableRow-root[style*="background-color: rgb(245, 245, 245)"], 
          .MuiTableRow-root[class*="bgcolor-[#f5f5f5]"] {
            background-color: #f5f5f5 !important;
          }

          /* Tanda Tangan */
          .signature-area {
            margin-top: auto !important;
            padding-top: 20px !important;
          }

          .signature-area .MuiGrid-item p:first-of-type {
            margin-bottom: 65px !important;
          }

          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          img {
            max-width: none !important;
          }
        }
      `}
    </style>
    </Box>
  );
};

export default LaporanHarianChecker;