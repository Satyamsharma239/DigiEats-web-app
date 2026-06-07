import { useState, useRef, useEffect } from "react";
import { Menu, Bell, UserCircle, LogOut, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../contexts/useAdmin.js";

export default function Header() {
    const { admin, logout } = useAdmin();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center">
                    <button className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-gray-400 hover:text-gray-500 relative">
                        <Bell className="h-6 w-6" />
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 pl-4 border-l border-gray-200 focus:outline-none hover:opacity-80 transition-opacity"
                        >
                            <div className="hidden sm:block text-right">
                                <div className="text-sm font-medium text-gray-900 leading-none mb-1">
                                    {admin?.email || "Admin User"}
                                </div>
                                <div className="text-xs text-gray-500 capitalize leading-none">
                                    {admin?.role || "superadmin"}
                                </div>
                            </div>
                            <UserCircle className="h-8 w-8 text-gray-400" />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 transition-all transform origin-top-right">
                                <button
                                    onClick={() => { setIsProfileOpen(false); navigate("/settings"); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <SettingsIcon className="w-4 h-4" /> Admin Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 pt-2"
                                >
                                    <LogOut className="w-4 h-4" /> Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
