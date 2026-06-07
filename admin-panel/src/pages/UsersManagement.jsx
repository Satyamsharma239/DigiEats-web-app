import { useState, useEffect } from "react";
import { useAdmin } from "../contexts/useAdmin.js";
import axios from "axios";
import { Trash2, UserX, UserCheck, Shield, Search } from "lucide-react";

export default function UsersManagement() {
    const { backendUrl, apiConfig } = useAdmin();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const roleQuery = filter === "all" ? "" : `?role=${filter}`;
            const res = await axios.get(`${backendUrl}/users${roleQuery}`, apiConfig);
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filter, backendUrl, apiConfig]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete user ${name || id}?`)) return;

        try {
            const res = await axios.delete(`${backendUrl}/users/${id}`, apiConfig);
            if (res.data.success) {
                setUsers(users.filter(u => u._id !== id));
            }
        } catch (error) {
            alert("Failed to delete user");
        }
    };

    const handleToggleBlock = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user?`)) return;

        try {
            const res = await axios.put(`${backendUrl}/users/${id}/status`, { isBlocked: !currentStatus }, apiConfig);
            if (res.data.success) {
                setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !currentStatus } : u));
            }
        } catch (error) {
            alert("Failed to update user status");
        }
    };

    const filteredUsers = users.filter(user =>
        (user.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.mobile || "").includes(searchTerm)
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                    <p className="text-gray-500 text-sm mt-1">View and manage all registered accounts</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Customers</option>
                        <option value="owner">Restaurant Owners</option>
                        <option value="deliveryBoy">Delivery Partners</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 font-semibold border-b">
                        <tr>
                            <th scope="col" className="px-6 py-4">Name & Contact</th>
                            <th scope="col" className="px-6 py-4">Role</th>
                            <th scope="col" className="px-6 py-4">Status</th>
                            <th scope="col" className="px-6 py-4">Joined</th>
                            <th scope="col" className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center">Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No users found</td></tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user._id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{user.fullName || "Un-named User"}</div>
                                        <div className="text-gray-500 text-xs mt-1">{user.email || "No Email"}</div>
                                        <div className="text-gray-500 text-xs">{user.mobile}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                            ${user.role === 'customer' || user.role === 'user' ? 'bg-blue-100 text-blue-800' :
                                                user.role === 'owner' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-teal-100 text-teal-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {user.isOtpVerified ? (
                                                <div className="flex items-center text-emerald-600 text-xs">
                                                    <UserCheck className="w-4 h-4 mr-1.5" /> Verified
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-amber-500 text-xs">
                                                    <Shield className="w-4 h-4 mr-1.5" /> Pending
                                                </div>
                                            )}
                                            {user.isBlocked && (
                                                <div className="flex items-center text-red-600 font-medium text-xs">
                                                    <UserX className="w-4 h-4 mr-1.5" /> Blocked
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            title={user.isBlocked ? "Unblock User" : "Block User"}
                                            onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                                            className={`p-2 rounded-lg transition-colors ${user.isBlocked
                                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                                    : 'text-amber-600 hover:bg-amber-50'
                                                }`}
                                        >
                                            {user.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                        </button>
                                        <button
                                            title="Delete Account"
                                            onClick={() => handleDelete(user._id, user.fullName)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
