// assets
import NavigationOutlinedIcon from '@mui/icons-material/NavigationOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import ContactSupportOutlinedIcon from '@mui/icons-material/ContactSupportOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ChromeReaderModeOutlinedIcon from '@mui/icons-material/ChromeReaderModeOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';

// daftar icon
const icons = {
  NavigationOutlinedIcon,
  HomeOutlinedIcon,
  ChromeReaderModeOutlinedIcon,
  HelpOutlineOutlinedIcon,
  SecurityOutlinedIcon,
  AccountTreeOutlinedIcon,
  BlockOutlinedIcon,
  AppsOutlinedIcon,
  ContactSupportOutlinedIcon,
  SmartphoneOutlinedIcon,
  DiamondOutlinedIcon,
  InfoOutlinedIcon,
  PeopleAltOutlinedIcon,
  CategoryOutlinedIcon
};

// ==============================|| MENU ITEMS ||============================== //

export default {
  items: [
    {
      id: 'navigation',
      title: 'Materially',
      caption: 'Dashboard',
      type: 'group',
      icon: icons.NavigationOutlinedIcon,
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          icon: icons.HomeOutlinedIcon,
          url: '/dashboard/default'
        }
      ]
    },
    {
      id: 'pages',
      title: 'Pages',
      caption: 'Prebuild Pages',
      type: 'group',
      icon: icons.AppsOutlinedIcon,
      children: [
        {
          id: 'data-nasabah',
          title: 'Data Nasabah',
          type: 'item',
          url: '/data-nasabah',
          icon: icons.PeopleAltOutlinedIcon
        },
        {
          id: 'type',
          title: 'Type Penggadaian',
          type: 'item',
          url: '/type',
          icon: icons.CategoryOutlinedIcon
        },
        {
          id: 'detail-gadai',
          title: 'Detail Penggadaian',
          type: 'item',
          url: '/detail-gadai',
          icon: icons.InfoOutlinedIcon
        },
        {
          id: 'perpanjangan-tempo',
          title: 'Perpanjangan Tempo',
          type: 'item',
          url: '/perpanjangan-tempo',
          icon: icons.TimerOutlinedIcon 
        }

      ]
    },
    {
      id: 'penggadaian',
      title: 'Macam Macam Gadai',
      type: 'group',
      icon: icons.AccountTreeOutlinedIcon,
      children: [
        {
          id: 'gadai-hp',
          title: 'Gadai HP',
          type: 'item',
          url: '/gadai-hp',
          icon: icons.SmartphoneOutlinedIcon
        },
        {
          id: 'gadai-perhiasan',
          title: 'Gadai Perhiasan',
          type: 'item',
          url: '/gadai-perhiasan',
          icon: icons.DiamondOutlinedIcon
        },
        {
          id: 'gadai-logam-mulia',
          title: 'Gadai Logam Mulia',
          type: 'item',
          url: '/gadai-logam-mulia',
          icon: icons.SecurityOutlinedIcon
        },
        {
          id: 'gadai-retro',
          title: 'Gadai Retro',
          type: 'item',
          url: '/gadai-retro',
          icon: icons.MonetizationOnOutlinedIcon
        }

      ]
    },
  ]
};
