// assets
import NavigationOutlinedIcon from '@mui/icons-material/NavigationOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';

import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import RepeatIcon from '@mui/icons-material/Repeat';
import AutorenewIcon from '@mui/icons-material/Autorenew';
// daftar icon
const icons = {
  NavigationOutlinedIcon,
  HomeOutlinedIcon,
  AppsOutlinedIcon,
  PeopleAltOutlinedIcon,
  CategoryOutlinedIcon,
  InfoOutlinedIcon,
  DiamondOutlinedIcon,
  SmartphoneOutlinedIcon,
  SecurityOutlinedIcon,
  MonetizationOnOutlinedIcon,
  TimerOutlinedIcon,
  NotificationsNoneOutlinedIcon,
  CheckCircleOutlineOutlinedIcon,
  BuildOutlinedIcon,
  RestartAltIcon,
  RepeatIcon,
  AutorenewIcon,
  PriceCheckIcon,
  AccountTreeOutlinedIcon,
  AccountBalanceWalletIcon,
  AssessmentOutlinedIcon,
  FactCheckOutlinedIcon,
};

// ==============================|| MENU ITEMS ||============================== //

export default {
  items: [
    // Dashboard
    {
      id: 'navigation',
      title: 'Dashboard',
      type: 'group',
      icon: icons.NavigationOutlinedIcon,
      role: ['hm'],
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          url: '/dashboard/default',
          icon: icons.HomeOutlinedIcon,
          role: ['hm']
        },
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          url: '/brangkas-dashboard',
          icon: icons.HomeOutlinedIcon,
          role: ['admin', 'checker']
        }
      ]
    },

    {
      id: 'nasabah',
      title: 'Data Gadai',
      type: 'group',
      icon: icons.PeopleAltOutlinedIcon,
      children: [
        {
          id: 'add-nasabah',
          title: 'Transaksi',
          type: 'collapse',
          icon: icons.PeopleAltOutlinedIcon,
          role: ['checker', 'hm', 'petugas'],
          children: [
            {
              id: 'add-nasabah-hp',
              title: 'Gadai HP',
              type: 'item',
              url: '/full-submit',
              icon: icons.SmartphoneOutlinedIcon,
              role: ['checker', 'hm', 'petugas']
            },
            {
              id: 'add-nasabah-emas',
              title: 'Gadai Emas',
              type: 'item',
              url: '/gadai-emas',
              icon: icons.DiamondOutlinedIcon,
              role: ['checker', 'hm', 'petugas']
            },

            {
          id: 'gadai-ulang-hp',
          title: ' Gadai ulang HP',
          type: 'item',
          url: '/gadai-Ulang-hp',
          icon: icons.SmartphoneOutlinedIcon,
          role: ['checker', 'hm', 'petugas']
        },
        {
          id: 'gadai-ulang-emas',
          title: 'Gadai Ulang Emas',
          type: 'item',
          url: '/gadai-ulang-emas',
          icon: icons.DiamondOutlinedIcon,
          role: ['checker', 'hm', 'petugas']
        }
          ]
        },

        {
          id: 'data-nasabah',
          title: 'Data Gadai',
          type: 'collapse',
          icon: icons.InfoOutlinedIcon,
          role: ['checker', 'hm', 'petugas'],
          children: [
            {
              id: 'data-nasabah-list',
              title: 'List Nasabah',
              type: 'item',
              url: '/data-nasabah',
              icon: icons.PeopleAltOutlinedIcon,
              role: ['checker', 'hm', 'petugas']
            },
            {
              id: 'type-penggadaian',
              title: 'Type Penggadaian',
              type: 'item',
              url: '/type',
              icon: icons.CategoryOutlinedIcon,
              role: ['checker', 'hm',]
            },
            {
              id: 'detail-gadai',
              title: 'Detail Gadai',
              type: 'item',
              url: '/detail-gadai',
              icon: icons.InfoOutlinedIcon,
              role: ['checker', 'hm', 'petugas']
            },
            {
              id: 'perpanjangan-tempo',
              title: 'Perpanjangan Tempo',
              type: 'item',
              url: '/perpanjangan-tempo',
              icon: icons.TimerOutlinedIcon,
              role: ['checker', 'hm', 'petugas']
            },

          ]
        }
      ]
    },


{ 
      id: 'laporan-group',
      title: 'Laporan',
      type: 'group',
      icon: icons.AssessmentOutlinedIcon,
      children: [
        {
          id: 'Laporan Harian',
          title: 'Laporan Checker',
          type: 'item',
          url: '/laporan-harian',
          icon: icons.AssessmentOutlinedIcon,
          role: ['checker'] 
        },

        {
      id: 'Laporan Harian Petugas',
      title: 'Laporan Petugas',
      type: 'item',
      url: '/laporan-harian-petugas',
      icon: icons.AssessmentOutlinedIcon,
      role: ['petugas']
    },

    {
              id: 'Laporan approval',
              title: 'Laporan Approval',
              type: 'item',
              url: '/pengajuan-laporan',
              icon: icons.AssessmentOutlinedIcon,
              role: [ 'hm',]
            },

      ]
    },

    {
      id: 'gadai',
      title: 'Macam Macam Gadai',
      type: 'group',
      icon: icons.AccountTreeOutlinedIcon,
      children: [
        {
          id: 'gadai-collapse',
          title: 'Gadai',
          type: 'collapse',
          icon: icons.AccountTreeOutlinedIcon,
          role: ['checker', 'hm', 'petugas'],
          children: [
            { id: 'gadai-hp', title: 'Gadai HP', type: 'item', url: '/gadai-hp', icon: icons.SmartphoneOutlinedIcon, role: ['checker', 'hm', 'petugas'] },
            { id: 'gadai-logam-mulia', title: 'Gadai Logam Mulia', type: 'item', url: '/gadai-logam-mulia', icon: icons.SecurityOutlinedIcon, role: ['checker', 'hm', 'petugas'] },
            { id: 'gadai-retro', title: 'Gadai Retro', type: 'item', url: '/gadai-retro', icon: icons.MonetizationOnOutlinedIcon, role: ['checker', 'hm', 'petugas'] },
            { id: 'gadai-perhiasan', title: 'Gadai Perhiasan', type: 'item', url: '/gadai-perhiasan', icon: icons.DiamondOutlinedIcon, role: ['checker', 'hm', 'petugas'] }
          ]
        }
      ]
    },

    // Kelengkapan & Lain-lain
    {
      id: 'kelengkapan',
      title: 'Kelengkapan',
      type: 'group',
      icon: icons.BuildOutlinedIcon,
      children: [
        {
          id: 'kelengkapan-page',
          title: 'Kelengkapan',
          type: 'collapse',
          icon: icons.BuildOutlinedIcon,
          role: ['checker', 'hm'],
          children: [
            { id: 'kelengkapan-hp', title: 'HP', type: 'item', url: '/kelengkapan', icon: icons.SmartphoneOutlinedIcon, role: ['checker', 'hm'] },
            { id: 'kelengkapan-emas', title: 'Emas', type: 'item', url: '/kelengkapan-emas', icon: icons.DiamondOutlinedIcon, role: ['checker', 'hm'] },
            { id: 'kerusakan', title: 'Kerusakan', type: 'item', url: '/kerusakan', icon: icons.BuildOutlinedIcon, role: ['checker', 'hm'] },
            { 
  id: 'harga-hp', 
  title: 'Harga HP', 
  type: 'item', 
  url: '/harga-hp', 
  icon: icons.PriceCheckIcon, 
  role: ['checker', 'hm', 'petugas', 'admin'] 
},
            { id: 'merk-hp', title: 'Merk HP', type: 'item', url: '/merk-hp', icon: icons.SmartphoneOutlinedIcon, role: ['checker', 'hm'] },
            { id: 'type-hp', title: 'Type HP', type: 'item', url: '/type-hp', icon: icons.CategoryOutlinedIcon, role: ['checker', 'hm'] },
            { id: 'grade-hp', title: 'Grade HP', type: 'item', url: '/grade-hp', icon: icons.InfoOutlinedIcon, role: ['checker', 'hm'] }
            
          ]
        }
      ]
    },

    // Approval
    {
      id: 'approval',
      title: 'Pengajuan',
      type: 'group',
      icon: icons.CheckCircleOutlineOutlinedIcon,
      children: [
        { id: 'approval-checker', title: 'Checker', type: 'item', url: '/approval-gadai', icon: icons.CheckCircleOutlineOutlinedIcon, role: ['checker'] },
        { id: 'approval-hm', title: 'HM', type: 'item', url: '/approval-hm-gadai', icon: icons.CheckCircleOutlineOutlinedIcon, role: ['hm'] },
        { id: 'notifications-item', title: 'Pemberitahuan', type: 'item', url: '/notifications', icon: icons.NotificationsNoneOutlinedIcon, role: ['checker', 'hm', 'petugas'] }
      ]
    },

    // Admin
    { 
      id: 'admin',
      title: 'Admin Information',
      type: 'group',
      icon: icons.AccountTreeOutlinedIcon,
      children: [
        { id: 'admin-laporan', title: 'Laporan Admin', type: 'item', url: '/admin', icon: icons.AccountTreeOutlinedIcon, role: ['hm', 'admin'] },
         {
      id: 'Laporan Mingguan Admin',
      title: 'Laporan mingguan',
      type: 'item',
      url: '/laporan-mingguan',
      icon: icons.AssessmentOutlinedIcon,
      role: ['admin',]
    },

     {
      id: 'Laporan struk awal Mingguan Admin',
      title: 'struk awal',
      type: 'item',
      url: '/laporan-struk-awal',
      icon: icons.AssessmentOutlinedIcon,
      role: ['admin', 'hm']
    },


     {
      id: 'Laporan struk Mingguan Admin',
      title: 'struk perpanjangan',
      type: 'item',
      url: '/laporan-struk-perpanjangan',
      icon: icons.AssessmentOutlinedIcon,
      role: ['admin', 'hm']
    },

    {
      id: 'Laporan struk pelunasan Mingguan Admin',
      title: 'struk pelunasan',
      type: 'item',
      url: '/laporan-struk-pelunasan',
      icon: icons.AssessmentOutlinedIcon,
      role: ['admin', 'hm']
    },
    {
      id: 'Laporan struk pelunasan lelang Mingguan Admin',
      title: 'struk pelunasan lelang',
      type: 'item',
      url: '/laporan-struk-pelunasan-lelang',
      icon: icons.AssessmentOutlinedIcon,
      role: ['admin', 'hm']
    },
      ]
    },

    // Lelang
    {
      id: 'lelang',
      title: 'Pelelangan',
      type: 'group',
      icon: icons.AccountTreeOutlinedIcon,
      children: [
        { id: 'data-lelang', title: 'Data Lelang', type: 'item', url: '/pelelangan', icon: icons.NotificationsNoneOutlinedIcon, role: ['hm', 'checker', 'admin'] }
      ]
    },

    //ewalet
      {
      id: 'Kas Management',
      title: 'Kas Management',
      type: 'group',
      icon: icons.AccountBalanceWalletIcon,
      children: [
        { id: 'Kas Management', title: 'kas management', type: 'item', url: '/kas-management', icon: icons.AccountBalanceWalletIcon, role: ['hm','admin'] },
        { id: 'Kas Management Cheker', title: 'kas management Checker', type: 'item', url: '/kas-management-checker', icon: icons.AccountBalanceWalletIcon, role: ['hm','checker'] }
      ]
    },

  ]
};
