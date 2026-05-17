import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const token = localStorage.getItem('admin_token');

    console.log('ProtectedRoute: Checking token...', token ? 'Token exists' : 'No token');

    if (!token) {
        console.log('ProtectedRoute: No token found, redirecting to login');
        return <Navigate to="/admin/login" replace />;
    }

    console.log('ProtectedRoute: Token found, rendering children');
    return <>{children}</>;
};
