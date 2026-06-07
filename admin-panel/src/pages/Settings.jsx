import { useState } from "react";
import { useAdmin } from "../contexts/useAdmin.js";
import { User, Bell, Shield, Key, Save } from "lucide-react";

export default function Settings() {
    const { admin } = useAdmin();
    const [activeTab, setActiveTab] = useState("profile");

    // Form states
    const [notifications, setNotifications] = useState(true);
    const [loginAlerts, setLoginAlerts] = useState(true);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Admin Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your account preferences and security</p>
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Sidebar Navigation */}
                <div className="md:w-64 border-r border-gray-100 p-4">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === "profile" ? "bg-indigo-50 text-indigo-700" : "text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <User className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
                            Account Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === "security" ? "bg-indigo-50 text-indigo-700" : "text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <Shield className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab("notifications")}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === "notifications" ? "bg-indigo-50 text-indigo-700" : "text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <Bell className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
                            Notifications
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8">
                    {activeTab === "profile" && (
                        <div className="max-w-xl">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={admin?.email || "Superadmin"}
                                        className="bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-lg block w-full p-2.5 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This is your primary login email.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Role</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={admin?.role || "superadmin"}
                                        className="bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-lg block w-full p-2.5 cursor-not-allowed uppercase"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="max-w-xl">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg mb-6 flex items-start gap-3">
                                <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800">Password Management</h4>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Password changes are currently disabled in this demo environment to prevent lockouts.
                                        Please contact the primary system administrator to request a credential reset.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 opacity-50 pointer-events-none">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input type="password" value="********" readOnly className="border border-gray-300 rounded-lg block w-full p-2.5 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input type="password" placeholder="New password" readOnly className="border border-gray-300 rounded-lg block w-full p-2.5 bg-gray-50" />
                                </div>
                                <div className="pt-2">
                                    <button className="bg-gray-300 text-gray-500 font-medium py-2 px-4 rounded-lg text-sm cursor-not-allowed">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className="max-w-xl">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <div>
                                        <div className="font-medium text-gray-900">Email Notifications</div>
                                        <div className="text-sm text-gray-500">Receive daily summaries and system alerts</div>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                </label>

                                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <div>
                                        <div className="font-medium text-gray-900">Login Security Alerts</div>
                                        <div className="text-sm text-gray-500">Email me when a new admin login occurs</div>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={loginAlerts} onChange={(e) => setLoginAlerts(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
