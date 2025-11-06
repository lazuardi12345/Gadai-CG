import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component
 * @param {ReactNode} children - komponen anak yang dilindungi
 * @param {Array<string>} roles - daftar role yang diizinkan (optional)
 */
const ProtectedRoute = ({ children, roles = [] }) => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user'); // pastikan user disimpan di localStorage
    const user = userData ? JSON.parse(userData) : null;
    const userRole = user?.role;

    // 1️⃣ Cek login
    if (roles.length > 0 && !roles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }


    // 2️⃣ Cek role (kalau roles di-set)
    if (roles.length > 0 && !roles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3️⃣ Kalau lolos semua
    return children;
};

export default ProtectedRoute;
