import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Store, Receipt, Settings, LogOut } from "lucide-react";
import { useAdmin } from "../contexts/useAdmin.js";

export default function Sidebar() {
    const location = useLocation();
    const { logout } = useAdmin();

    const navigation = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Users", href: "/users", icon: Users },
        { name: "Restaurants", href: "/shops", icon: Store },
        { name: "Orders", href: "/orders", icon: Receipt },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    const isActive = (path) => {
        if (path === "/" && location.pathname !== "/") return false;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800">
            <div className="h-16 flex items-center px-6 border-b border-gray-800">
                <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                    <span className="bg-indigo-600 text-white p-1 rounded-md">D</span>
                    DigiEats Admin
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3 space-y-1">
                    {navigation.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`
                                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                    ${active
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }
                                `}
                            >
                                <item.icon
                                    className={`mr-3 flex-shrink-0 h-5 w-5 ${active ? "text-white" : "text-gray-400 group-hover:text-white"}`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign out
                </button>
            </div>
        </div>
    );
}
