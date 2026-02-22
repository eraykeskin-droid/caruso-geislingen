import React from 'react';
import AdminAuth from './AdminAuth';
import AdminDashboard from './AdminDashboard';

const AdminApp = () => {
    return (
        <AdminAuth>
            <AdminDashboard />
        </AdminAuth>
    );
};

export default AdminApp;
