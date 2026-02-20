import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  Box, Card, Typography, Tab, Tabs, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Button, 
  Paper, CircularProgress, Stack, TextField, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import { Print, Refresh, History as HistoryIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";
import KwitansiBgImg from '../../assets/images/kwitansi-bg.png'; 

const DaftarKwitansiHariIni = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [fullDataCetak, setFullDataCetak] = useState(null); 
  const [openModal, setOpenModal] = useState(false);
  const [selectedRekening, setSelectedRekening] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/kwitansi/riwayat-hari-ini', { 
        params: { tipe: tabValue, tanggal: tanggal } 
      });
      if (res.data.success) setDataList(res.data.data);
    } catch (err) { console.error("Gagal load", err); } 
    finally { setLoading(false); }
  }, [tabValue, tanggal]);

  useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);
const triggerAuditCetak = async (noKwitansi) => {
  if (!noKwitansi || noKwitansi === '-') return;
  try {
    await axiosInstance.post('/kwitansi/update-audit', { no_kwitansi: noKwitansi });
    console.log("✅ Audit berhasil untuk:", noKwitansi); // Debug log
  } catch (err) { 
    console.error("❌ Audit Gagal", err); 
    alert("Gagal mencatat audit cetak!");
  }
};

const handlePreparePrint = async (row) => {
  try {
    setFullDataCetak(null);
    const res = await axiosInstance.get(`/kwitansi/${row.jenis}/${row.id}`);
    if (res.data.success) {
      setFullDataCetak(res.data.data);
      const noKwitansi = res.data.data.no_kwitansi;
      
      // ⚡ UPDATE AUDIT DULU SEBELUM PRINT
      await triggerAuditCetak(noKwitansi);
      
      if (res.data.data.metode?.toLowerCase() === 'cash') {
        setSelectedRekening('CASH / TUNAI');
        setTimeout(() => { 
          window.print();
          fetchRiwayat(); // Refresh setelah print
        }, 300);
      } else {
        setSelectedRekening(''); 
        setOpenModal(true);
      }
    }
  } catch (err) { 
    console.error(err);
    alert("Gagal ambil data"); 
  }
};

const handleFinalPrint = async () => {
  if (!selectedRekening) return;
  const nk = fullDataCetak.no_kwitansi;
  
  setOpenModal(false);
  await triggerAuditCetak(nk);
  
  setTimeout(() => { 
    window.print();
    fetchRiwayat(); 
  }, 300);
};

  return (
    <Box sx={{ p: 3, bgcolor: '#455a64', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight="bold">Kwitansi Hari Ini</Typography>
            <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchRiwayat}>Refresh</Button>
           <Button 
              variant="contained" 
              color="primary" 
              startIcon={<HistoryIcon />} 
              onClick={() => navigate('/riwayat-kwitansi')} 
              sx={{ ml: 2 }}
          >
              Riwayat Kwitansi
          </Button>
          </Stack>
          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
            <Tab label="Pelunasan" /><Tab label="Perpanjangan" /><Tab label="Lelang" />
          </Tabs>
        </Stack>
      </Card>

      <TableContainer component={Paper} className="no-print">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>WAKTU</TableCell>
              <TableCell>NO. GADAI</TableCell>
              <TableCell>NASABAH</TableCell>
              <TableCell align="center">JML CETAK</TableCell>
              <TableCell>CETAK 1</TableCell>
              <TableCell>TERAKHIR</TableCell>
              <TableCell align="center">AKSI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataList.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.waktu}</TableCell>
                <TableCell><b>{row.no_gadai}</b></TableCell>
                <TableCell>{row.nasabah}</TableCell>
                <TableCell align="center">
                    <Typography sx={{ fontWeight: 'bold', color: row.jumlah_cetak > 0 ? 'green' : 'red' }}>
                        {row.jumlah_cetak}x
                    </Typography>
                </TableCell>
                <TableCell>{row.tgl_cetak_pertama}</TableCell>
                <TableCell>{row.jumlah_cetak > 1 ? row.tgl_cetak_terakhir : '-'}</TableCell>
                <TableCell align="center">
                  <Button variant="contained" size="small" startIcon={<Print />} onClick={() => handlePreparePrint(row)}>
                    {row.jumlah_cetak > 0 ? "Cetak Ulang" : "Cetak"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Pilih Rekening</DialogTitle>
        <DialogContent>
          <RadioGroup value={selectedRekening} onChange={(e) => setSelectedRekening(e.target.value)}>
            {fullDataCetak?.norek_list && Object.entries(fullDataCetak.norek_list).map(([k, v]) => (
              <FormControlLabel key={k} value={`${k} - ${v}`} control={<Radio />} label={`${k}: ${v}`} />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Batal</Button>
          <Button variant="contained" onClick={handleFinalPrint} disabled={!selectedRekening}>Cetak</Button>
        </DialogActions>
      </Dialog>

      {fullDataCetak && (
        <Box className="print-container">
          <KwitansiBlock data={fullDataCetak} rekPilihan={selectedRekening} />
        </Box>
      )}

      <style>{`
        @media screen { .print-container { display: none; } }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible !important; }
          .print-container { position: absolute; top: 0; left: 0; width: 210mm; }
          .no-print { display: none !important; }
        }
      `}</style>
    </Box>
  );
};
const KwitansiBlock = ({ data, rekPilihan }) => {
  const isTransfer = rekPilihan && rekPilihan.toLowerCase() !== 'cash / tunai';

  return (
    <Box sx={{ 
      width: '210mm', height: '148.5mm', position: 'relative', 
      p: '35mm 18mm 10mm 18mm', boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif', color: '#000'
    }}>
      <img src={KwitansiBgImg} alt="bg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />
      
      {data.is_copy && (
        <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', 
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            opacity: 0.1, zIndex: 0, border: '10px solid #000', p: 2
        }}>
            <Typography sx={{ fontSize: '60pt', fontWeight: 'bold' }}>SALINAN</Typography>
        </Box>
      )}

      <Box sx={{ position: 'absolute', right: '18mm', top: '25mm', textAlign: 'right' }}>
        <Typography sx={{ fontSize: '10pt', fontWeight: 'bold' }}>No. {data.no_kwitansi}</Typography>
        <Typography sx={{ fontSize: '9pt' }}>Tgl. {data.tanggal}</Typography>
      </Box>

      <Typography align="center" sx={{ fontSize: '14pt', fontWeight: 900, textDecoration: 'underline', mb: 3 }}>
        KWITANSI PEMBAYARAN
      </Typography>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '120px', padding: '3px 0' }}>Terima Dari</td>
            <td style={{ width: '20px' }}>:</td>
            <td style={{ fontWeight: 'bold', borderBottom: '1px dotted #888', fontSize: '11pt' }}>{data.nasabah?.toUpperCase()}</td>
          </tr>
          <tr>
            <td style={{ padding: '3px 0' }}>Tujuan Ke</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #888' }}>{rekPilihan}</td>
          </tr>
          {isTransfer && (
            <tr>
              <td style={{ padding: '3px 0' }}>Transfer Dari</td>
              <td>:</td>
              <td style={{ borderBottom: '1px dotted #888', color: '#333', fontSize: '9pt' }}>
                A.N: ......................... No. Rek: ......................... Bank: .............
              </td>
            </tr>
          )}
          <tr>
            <td style={{ padding: '3px 0' }}>Keterangan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #888', fontStyle: 'italic' }}>{data.untuk}</td>
          </tr>
        </tbody>
      </table>

      <Grid container spacing={2}>
        <Grid item xs={6.5}>
          <table style={{ fontSize: '9.5pt', width: '100%' }}>
            <tbody>
              {data.rincian && Object.entries(data.rincian).map(([key, val]) => (
                <tr key={key}>
                  <td style={{ padding: '2px 0', width: '160px' }}>• {key}</td>
                  <td style={{ width: '20px' }}>:</td>
                  <td style={{ fontWeight: 'bold' }}>Rp {val?.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <Box sx={{ mt: 3 }}>
            <Box sx={{ 
              border: '2px solid #000', p: '8px 15px', display: 'inline-block', 
              fontWeight: 900, fontSize: '13pt', minWidth: '180px', bgcolor: '#fff !important'
            }}>
              TOTAL: Rp {data.total?.toLocaleString('id-ID')}
            </Box>
            
            <Typography sx={{ fontSize: '7pt', mt: 2, fontStyle: 'italic', color: '#333', lineHeight: 1.2 }}>
              * Kwitansi ini adalah bukti pembayaran yang sah dan valid: {data.petugas_akses} <br/>
              * Harap simpan kwitansi ini sebagai referensi transaksi Anda. <br/>
              {data.is_copy && `* Cetakan ke-${data.cetak_ke}. ${data.audit_info}`}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={5.5}>
          <Grid container textAlign="center" sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Box sx={{ height: '40px' }} />
              <Typography sx={{ fontSize: '8pt' }}>( ............................... )</Typography>
              <Typography sx={{ fontSize: '7.5pt', fontWeight: 'bold' }}>Nasabah</Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ height: '40px' }} />
              <Typography sx={{ fontSize: '8pt' }}>( ................................ )</Typography>
              <Typography sx={{ fontSize: '7.5pt', fontWeight: 'bold' }}>Kasir</Typography>
            </Grid>
          </Grid>
          <Grid container textAlign="center">
            <Grid item xs={6}>
              <Box sx={{ height: '40px' }} />
              <Typography sx={{ fontSize: '8pt' }}>( .................................. )</Typography>
              <Typography sx={{ fontSize: '7.5pt', fontWeight: 'bold' }}>Admin</Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ height: '40px' }} />
              <Typography sx={{ fontSize: '8pt' }}>( ................................... )</Typography>
              <Typography sx={{ fontSize: '7.5pt', fontWeight: 'bold' }}>Manager</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DaftarKwitansiHariIni;