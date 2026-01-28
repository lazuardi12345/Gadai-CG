import PropTypes from 'prop-types';
import React, { useContext } from 'react'; // Tambah useContext

// material-ui
import { useTheme } from '@mui/material/styles';
import { Typography, ListItemIcon, ListItemText, Collapse, List, ListItemButton, Badge } from '@mui/material'; // Tambah Badge

// project import
import NavItem from '../NavItem';
import { BadgeContext } from 'contexts/BadgeContext'; // Tambah BadgeContext

// assets
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ==============================|| NAV COLLAPSE ||============================== //

const NavCollapse = ({ menu, level }) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  
  // Ambil data badge untuk menghitung total notif di dalam collapse ini
  const { badges } = useContext(BadgeContext);

  const handleClick = () => {
    setOpen(!open);
    setSelected(!selected ? menu.id : null);
  };

  // Hitung total badge dari semua children di dalam collapse ini
  const totalChildBadges = menu.children?.reduce((acc, child) => {
    return acc + (child.badgeKey ? (badges[child.badgeKey] || 0) : 0);
  }, 0);

  const menus = menu.children.map((item) => {
    switch (item.type) {
      case 'collapse':
        return <NavCollapse key={item.id} menu={item} level={level + 1} />;
      case 'item':
        return <NavItem key={item.id} item={item} level={level + 1} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Menu Items Error
          </Typography>
        );
    }
  });

  const Icon = menu.icon;
  const menuIcon = menu.icon ? (
    // Tampilkan total angka merah jika ada notif di dalam menu collapse
    <Badge badgeContent={totalChildBadges} color="error" sx={{ '& .MuiBadge-badge': { right: -2, top: 2 } }}>
      <Icon />
    </Badge>
  ) : (
    <ArrowForwardIcon fontSize={level > 0 ? 'inherit' : 'default'} />
  );

  return (
    <>
      <ListItemButton
        sx={{
          borderRadius: '5px',
          mb: 0.6,
          pl: `${level * 16}px`,
          ...(level > 1 && { backgroundColor: 'transparent !important', py: 1, borderRadius: '5px' })
        }}
        selected={selected === menu.id}
        onClick={handleClick}
      >
        <ListItemIcon sx={{ minWidth: !menu.icon ? '25px' : 'unset' }}>{menuIcon}</ListItemIcon>
        <ListItemText
          primary={
            <Typography variant={selected === menu.id ? 'subtitle1' : 'body1'} color="inherit" sx={{ pl: 1.9 }}>
              {menu.title}
            </Typography>
          }
          secondary={
            menu.caption && (
              <Typography variant="caption" sx={{ ...theme.typography.subMenuCaption, pl: 2 }} display="block" gutterBottom>
                {menu.caption}
              </Typography>
            )
          }
        />
        {open ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {menus}
        </List>
      </Collapse>
    </>
  );
};

NavCollapse.propTypes = {
  menu: PropTypes.object,
  level: PropTypes.number,
  title: PropTypes.string,
  icon: PropTypes.string,
  id: PropTypes.string,
  children: PropTypes.string
};

export default NavCollapse;