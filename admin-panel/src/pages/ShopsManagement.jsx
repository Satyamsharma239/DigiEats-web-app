import { useState, useEffect } from "react";
import { useAdmin } from "../contexts/useAdmin.js";
import axios from "axios";
import { CheckCircle, XCircle, MapPin, Store } from "lucide-react";

export default function ShopsManagement() {
    const { backendUrl, apiConfig } = useAdmin();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchShops = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/shops`, apiConfig);
            if (res.data.success) {
                setShops(res.data.shops);
            }
        } catch (error) {
            console.error("Failed to fetch shops:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, [backendUrl, apiConfig]);

    const toggleStatus = async (id, currentStatus) => {
        try {
            const res = await axios.put(`${backendUrl}/shops/${id}/status`, { isActive: !currentStatus }, apiConfig);
            if (res.data.success) {
                // Update local state without full reload
                setShops(shops.map(s => s._id === id ? { ...s, isActive: !currentStatus } : s));
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Restaurant Management</h2>
                <p className="text-gray-500 text-sm mt-1">Approve or suspend restaurant listings on DigiEats</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500">Loading restaurants...</div>
                ) : shops.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400">No restaurants onboarded yet.</div>
                ) : (
                    shops.map((shop) => (
                        <div key={shop._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col">
                            <div className="h-40 w-full relative">
                                <img
                                    src={shop.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800'}
                                    className="w-full h-full object-cover"
                                    alt={shop.name}
                                />
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md
                                        ${shop.isActive ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                                        {shop.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <Store className="w-5 h-5 text-indigo-500" />
                                    {shop.name}
                                </h3>

                                <div className="text-sm text-gray-500 mb-4 flex items-start gap-1">
                                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                    <span>{shop.address || "No address provided"}</span>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3 text-sm mb-5">
                                    <p className="text-gray-500 mb-1">Owner Information</p>
                                    <p className="font-medium text-gray-900">{shop.owner?.fullName || "N/A"}</p>
                                    <p className="text-gray-600">{shop.owner?.mobile || "N/A"}</p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
                                    {shop.isActive ? (
                                        <button
                                            onClick={() => toggleStatus(shop._id, shop.isActive)}
                                            className="flex-1 bg-red-50 border border-red-100 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> Suspend
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => toggleStatus(shop._id, shop.isActive)}
                                            className="flex-1 bg-emerald-50 border border-emerald-100 text-emerald-600 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve & Activate
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
