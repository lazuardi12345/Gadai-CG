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
  BuildOutlinedIcon
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
        }
      ]
    },

    // Add Nasabah
    {
      id: 'nasabah',
      title: 'Nasabah',
      type: 'group',
      icon: icons.PeopleAltOutlinedIcon,
      children: [
        {
          id: 'add-nasabah',
          title: 'Add Nasabah',
          type: 'collapse',
          icon: icons.PeopleAltOutlinedIcon,
          role: ['checker', 'hm', 'petugas'],
          children: [
            {
              id: 'add-nasabah-hp',
              title: 'HP',
              type: 'item',
              url: '/full-submit',
              icon: icons.SmartphoneOutlinedIcon,
              role: ['checker', 'hm', 'petugas']
            },
            {
              id: 'add-nasabah-emas',
              title: 'Emas',
              type: 'item',
              url: '/gadai-emas',
              icon: icons.DiamondOutlinedIcon,
              role: ['checker', 'hm', 'petugas']
            }
          ]
        },
        {
          id: 'data-nasabah',
          title: 'Data Nasabah',
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
              role: ['checker', 'hm', 'petugas']
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
            }
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
      title: 'Approval',
      type: 'group',
      icon: icons.CheckCircleOutlineOutlinedIcon,
      children: [
        { id: 'approval-checker', title: 'Checker', type: 'item', url: '/approval-gadai', icon: icons.CheckCircleOutlineOutlinedIcon, role: ['checker'] },
        { id: 'approval-hm', title: 'HM', type: 'item', url: '/approval-hm-gadai', icon: icons.CheckCircleOutlineOutlinedIcon, role: ['hm'] }
      ]
    },

    // Macam-macam Gadai
    {
      id: 'gadai',
      title: 'Macam Macam Gadai',
      type: 'group',
      icon: icons.AccountTreeOutlinedIcon,
      children: [
        {
          id: 'gadai-collapse',
          title: 'Gadai',
          type: 'collapse', // dropdown
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

    // Pemberitahuan
    {
      id: 'notifications',
      title: 'Pemberitahuan',
      type: 'group',
      icon: icons.NotificationsNoneOutlinedIcon,
      children: [
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
        { id: 'admin-laporan', title: 'Laporan Admin', type: 'item', url: '/admin', icon: icons.NotificationsNoneOutlinedIcon, role: ['hm', 'admin'] }
      ]
    },

    // Lelang
    {
      id: 'lelang',
      title: 'Pelelangan',
      type: 'group',
      icon: icons.AccountTreeOutlinedIcon,
      children: [
        { id: 'data-lelang', title: 'Data Lelang', type: 'item', url: '/pelelangan', icon: icons.NotificationsNoneOutlinedIcon, role: ['hm', 'petugas', 'checker', 'admin'] }
      ]
    }
  ]
};
