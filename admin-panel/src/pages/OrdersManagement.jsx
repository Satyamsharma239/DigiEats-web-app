import { useState, useEffect } from "react";
import { useAdmin } from "../contexts/useAdmin.js";
import axios from "axios";
import { Package, Truck, CheckCircle2, Clock, XCircle, Search, Store } from "lucide-react";

export default function OrdersManagement() {
    const { backendUrl, apiConfig } = useAdmin();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deliveryBoys, setDeliveryBoys] = useState([]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/orders`, apiConfig);
            if (res.data.success) {
                setOrders(res.data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveryBoys = async () => {
        try {
            const res = await axios.get(`${backendUrl}/users`, apiConfig);
            if (res.data.success) {
                const boys = res.data.users.filter(u => u.role === "deliveryBoy");
                setDeliveryBoys(boys);
            }
        } catch (error) {
            console.error("Failed to fetch delivery boys:", error);
        }
    };

    const handleStatusChange = async (parentOrderId, shopId, newStatus) => {
        try {
            const res = await axios.put(`${backendUrl}/orders/status`, {
                parentOrderId,
                shopId,
                status: newStatus
            }, apiConfig);

            if (res.data.success) {
                // Instantly update UI without full refetch
                setOrders(prev => prev.map(order => {
                    // Match either the parentOrderId + shopId, or if it was flattened to _id
                    if (order.parentOrderId === parentOrderId && order.shopId?._id === shopId) {
                        return { ...order, orderStatus: newStatus };
                    }
                    return order;
                }));
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update order status. Please try again.");
        }
    };

    const handleAssignDeliveryBoy = async (parentOrderId, shopId, deliveryBoyId) => {
        try {
            const res = await axios.put(`${backendUrl}/orders/assign-delivery-boy`, {
                parentOrderId,
                shopId,
                deliveryBoyId
            }, apiConfig);

            if (res.data.success) {
                // Instantly update UI without full refetch
                setOrders(prev => prev.map(order => {
                    if (order.parentOrderId === parentOrderId && order.shopId?._id === shopId) {
                        return { ...order, deliveryBoyId: res.data.assignedDeliveryBoy };
                    }
                    return order;
                }));
                alert("Delivery boy assigned successfully!");
            }
        } catch (error) {
            console.error("Failed to assign delivery boy:", error);
            alert(error.response?.data?.message || "Failed to assign delivery boy.");
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchDeliveryBoys();
    }, [backendUrl, apiConfig]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "pending": return "bg-amber-100 text-amber-800";
            case "accepted": return "bg-blue-100 text-blue-800";
            case "preparing": return "bg-purple-100 text-purple-800";
            case "out_for_delivery": return "bg-orange-100 text-orange-800";
            case "delivered": return "bg-emerald-100 text-emerald-800";
            case "cancelled": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending": return <Clock className="w-4 h-4 mr-1.5" />;
            case "out_for_delivery": return <Truck className="w-4 h-4 mr-1.5" />;
            case "delivered": return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
            case "cancelled": return <XCircle className="w-4 h-4 mr-1.5" />;
            default: return <Package className="w-4 h-4 mr-1.5" />;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order._id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (order.shopId?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (order.userId?.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Live Order Monitoring</h2>
                    <p className="text-gray-500 text-sm mt-1">Track all active and historical orders across DigiEats</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Order ID, Shop..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 font-semibold border-b">
                        <tr>
                            <th scope="col" className="px-6 py-4">Order Details</th>
                            <th scope="col" className="px-6 py-4">Customer</th>
                            <th scope="col" className="px-6 py-4">Restaurant</th>
                            <th scope="col" className="px-6 py-4">Delivery Partner</th>
                            <th scope="col" className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium">Loading platform orders...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No matching orders found.</td></tr>
                        ) : (
                            filteredOrders.map((order) => {
                                try {
                                    return (
                                        <tr key={order._id || Math.random().toString()} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-indigo-600 mb-1">#{String(order._id || "unknown").slice(-8).toUpperCase()}</div>
                                                <div className="font-bold text-gray-900 border border-gray-200 inline-block px-2 py-0.5 rounded text-xs bg-gray-50">
                                                    ₹{order.totalAmount}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-2">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{order.userId?.fullName || "Guest"}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{order.userId?.mobile || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                                    <Store className="w-4 h-4 text-orange-500" />
                                                    {order.shopId?.name || "Unknown Shop"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    {order.deliveryBoyId ? (
                                                        <div>
                                                            <div className="font-medium text-gray-900">{order.deliveryBoyId?.fullName || "Assigned"}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{order.deliveryBoyId?.mobile || ""}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Not Assigned</span>
                                                    )}

                                                    <select
                                                        value={order.deliveryBoyId?._id || ""}
                                                        onChange={(e) => handleAssignDeliveryBoy(order.parentOrderId, order.shopId?._id, e.target.value)}
                                                        disabled={order.orderStatus === "delivered" || order.orderStatus === "cancelled"}
                                                        className={`mt-1 block w-full pl-2 pr-6 py-1 text-xs border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md ${(order.orderStatus === "delivered" || order.orderStatus === "cancelled")
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : "bg-white text-gray-900"
                                                            }`}
                                                    >
                                                        <option value="" disabled>Assign Partner</option>
                                                        {deliveryBoys.map(boy => (
                                                            <option key={boy._id} value={boy._id}>
                                                                {boy.fullName} ({boy.isOnline ? "Online" : "Offline"})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(order.orderStatus)}`}>
                                                        {getStatusIcon(order.orderStatus)}
                                                        {order.orderStatus ? String(order.orderStatus).replace(/_/g, " ") : "Pending"}
                                                    </span>
                                                    <select
                                                        value={order.orderStatus || "pending"}
                                                        onChange={(e) => handleStatusChange(order.parentOrderId, order.shopId?._id, e.target.value)}
                                                        className="mt-1 block w-full pl-2 pr-6 py-1 text-xs border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="accepted">Accepted</option>
                                                        <option value="preparing">Preparing</option>
                                                        <option value="out_for_delivery">Out for Delivery</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                } catch (error) {
                                    console.error("Error rendering order:", order, error);
                                    return (
                                        <tr key={Math.random().toString()} className="bg-red-50 border-b">
                                            <td colSpan="5" className="px-6 py-4 text-center text-red-600 text-sm">
                                                Error loading order details (Invalid Data)
                                            </td>
                                        </tr>
                                    );
                                }
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
