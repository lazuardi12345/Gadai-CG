import React, { useContext } from 'react';
import { Typography } from '@mui/material';
import NavGroup from './NavGroup';
import menuItem from 'menu-items';
import { AuthContext } from 'AuthContex/AuthContext'; // pastikan path sesuai

// ==============================|| MENULIST ||============================== //

const MenuList = () => {
  const { user } = useContext(AuthContext);

  // Fungsi untuk cek role user
  const hasAccess = (item) => {
    // kalau menu tidak punya role → semua boleh akses
    if (!item.role) return true;
    // kalau menu punya role → cek apakah user.role termasuk di dalamnya
    return item.role.includes(user?.role);
  };

  // Filter menu berdasarkan role
  const filteredMenu = menuItem.items
    .map((group) => {
      // filter setiap children berdasarkan role
      const filteredChildren = group.children?.filter(hasAccess) || [];
      // hanya tampilkan group kalau ada children yang boleh dilihat
      if (filteredChildren.length === 0) return null;
      return { ...group, children: filteredChildren };
    })
    .filter(Boolean); // hapus group kosong

  const navItems = filteredMenu.map((item) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={item.id} item={item} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Menu Items Error
          </Typography>
        );
    }
  });

  return navItems;
};

export default MenuList;
