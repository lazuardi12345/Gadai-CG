import PropTypes from 'prop-types';
import React, { useContext } from 'react'; 
import { Link } from 'react-router-dom';

import { Badge } from '@mui/material'; 
import { BadgeContext } from 'contexts/BadgeContext'; 

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Chip, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

// third party
import { useSelector, useDispatch } from 'react-redux';

// project import
import * as actionTypes from 'store/actions';

// assets
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ==============================|| NAV ITEM ||============================== //

const NavItem = ({ item, level }) => {
  const theme = useTheme();
  const customization = useSelector((state) => state.customization);
  const dispatch = useDispatch();
  
  // Ambil data badge dari context
  const { badges, resetBadge } = useContext(BadgeContext);

  /** * LOGIKA BARU: Menghitung nilai badge
   * Bisa menangani badgeKey berupa String tunggal atau Array
   */
  const getBadgeValue = () => {
    if (!item.badgeKey) return 0;
    
    // Jika badgeKey adalah Array (Contoh: ['NEW_PAWN', 'REPEAT_ORDER'])
    if (Array.isArray(item.badgeKey)) {
      return item.badgeKey.reduce((acc, key) => acc + (badges[key] || 0), 0);
    }
    
    // Jika badgeKey hanya String (Contoh: 'NEW_PAWN')
    return badges[item.badgeKey] || 0;
  };

  const badgeValue = getBadgeValue();

  const Icon = item.icon;
  const itemIcon = item.icon ? (
    <Badge 
      badgeContent={badgeValue} 
      color="error" 
      max={99} // Biar kalau ribuan nggak kepanjangan (munculnya 99+)
      sx={{ '& .MuiBadge-badge': { right: -2, top: 2 } }}
    >
      <Icon color="inherit" />
    </Badge>
  ) : (
    <ArrowForwardIcon color="inherit" fontSize={level > 0 ? 'inherit' : 'default'} />
  );

  let itemTarget = '';
  if (item.target) {
    itemTarget = '_blank';
  }
  let listItemProps = { component: Link, to: item.url };
  if (item.external) {
    listItemProps = { component: 'a', href: item.url };
  }

  const handleMenuClick = () => {
    dispatch({ type: actionTypes.MENU_OPEN, isOpen: item.id });
    
    // LOGIKA BARU: Reset Badge saat diklik (Support Array)
    if (item.badgeKey) {
      if (Array.isArray(item.badgeKey)) {
        item.badgeKey.forEach(key => resetBadge(key));
      } else {
        resetBadge(item.badgeKey);
      }
    }
  };

  return (
    <ListItemButton
      disabled={item.disabled}
      sx={{
        ...(level > 1 && { backgroundColor: 'transparent !important', py: 1, borderRadius: '5px' }),
        borderRadius: '5px',
        marginBottom: '5px',
        pl: `${level * 16}px`
      }}
      selected={customization.isOpen === item.id}
      component={Link}
      onClick={handleMenuClick}
      to={item.url}
      target={itemTarget}
      {...listItemProps}
    >
      <ListItemIcon sx={{ minWidth: 25 }}>{itemIcon}</ListItemIcon>
      <ListItemText
        primary={
          <Typography sx={{ pl: 1.4 }} variant={customization.isOpen === item.id ? 'subtitle1' : 'body1'} color="inherit">
            {item.title}
          </Typography>
        }
        secondary={
          item.caption && (
            <Typography variant="caption" sx={{ ...theme.typography.subMenuCaption, pl: 2 }} display="block" gutterBottom>
              {item.caption}
            </Typography>
          )
        }
      />
      {item.chip && (
        <Chip
          color={item.chip.color}
          variant={item.chip.variant}
          size={item.chip.size}
          label={item.chip.label}
          avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
        />
      )}
    </ListItemButton>
  );
};

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number,
  icon: PropTypes.object,
  target: PropTypes.string,
  url: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  title: PropTypes.string,
  caption: PropTypes.string,
  chip: PropTypes.object,
  color: PropTypes.string,
  label: PropTypes.string,
  avatar: PropTypes.object
};

export default NavItem;