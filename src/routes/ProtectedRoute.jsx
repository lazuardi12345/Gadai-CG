import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component
 * @param {ReactNode} children - komponen anak yang dilindungi
 * @param {Array<string>} roles - daftar role yang diizinkan (optional)
 */
const ProtectedRoute = ({ children, roles = [] }) => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user'); 
    const user = userData ? JSON.parse(userData) : null;
    const userRole = user?.role;

    // Cek login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2 Cek role (kalau roles di-set)
    if (roles.length > 0 && !roles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3Kalau lolos semua
    return children;
};

export default ProtectedRoute;
