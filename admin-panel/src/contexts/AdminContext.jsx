import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("adminToken") || null);
    const [loading, setLoading] = useState(true);

    const backendUrl = "http://localhost:8082/api/admin";

    useEffect(() => {
        if (token) {
            // Restore from local storage or decode to just have simple state
            const storedAdmin = localStorage.getItem("adminData");
            if (storedAdmin) {
                setAdmin(JSON.parse(storedAdmin));
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${backendUrl}/login`, { email, password });
            if (res.data.success) {
                setToken(res.data.token);
                setAdmin(res.data.admin);
                localStorage.setItem("adminToken", res.data.token);
                localStorage.setItem("adminData", JSON.stringify(res.data.admin));
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Login failed"
            };
        }
    };

    const logout = () => {
        setToken(null);
        setAdmin(null);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
    };

    const apiConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    return (
        <AdminContext.Provider value={{ admin, token, loading, login, logout, backendUrl, apiConfig }}>
            {children}
        </AdminContext.Provider>
    );
};
