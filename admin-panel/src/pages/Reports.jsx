import { useState, useEffect } from "react";
import { useAdmin } from "../contexts/useAdmin.js";
import axios from "axios";
import { Printer, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function Reports() {
    const { backendUrl, apiConfig } = useAdmin();
    const [detailedReports, setDetailedReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cityFilter, setCityFilter] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    // Parse date filters passed from Dashboard
    const queryParams = new URLSearchParams(location.search);
    const filter = queryParams.get('filter') || "all";
    const startParam = queryParams.get('start');
    const endParam = queryParams.get('end');

    useEffect(() => {
        const fetchDetailedReports = async () => {
            setLoading(true);
            try {
                let url = `${backendUrl}/detailed-reports`;
                const params = new URLSearchParams();

                if (filter !== "all" && filter !== "custom") {
                    const end = new Date();
                    const start = new Date();
                    if (filter === "today") start.setHours(0, 0, 0, 0);
                    if (filter === "week") start.setDate(start.getDate() - 7);
                    if (filter === "month") start.setMonth(start.getMonth() - 1);

                    params.append('startDate', start.toISOString());
                    params.append('endDate', end.toISOString());
                } else if (filter === "custom" && startParam && endParam) {
                    params.append('startDate', new Date(startParam).toISOString());
                    params.append('endDate', new Date(endParam).toISOString());
                }

                if (cityFilter && cityFilter.trim() !== "") {
                    params.append('city', cityFilter);
                }

                const queryString = params.toString();
                if (queryString) {
                    url += `?${queryString}`;
                }

                const res = await axios.get(url, apiConfig);
                if (res.data.success) {
                    setDetailedReports(res.data.reports);
                }
            } catch (error) {
                console.error("Error fetching detailed reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetailedReports();
    }, [backendUrl, apiConfig, filter, startParam, endParam, cityFilter]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading comprehensive reports...</div>;
    }

    if (!detailedReports) {
        return <div className="p-8 text-center text-red-500">Failed to load detailed reports.</div>;
    }

    // Chart Data Preparation
    const shopChartData = detailedReports.shops.slice(0, 10).map(s => ({
        name: s.shopName,
        Revenue: s.totalRevenue,
        Orders: s.totalOrders
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#4F46E5', '#EC4899', '#10B981'];
    const itemChartData = detailedReports.items.slice(0, 10).map(i => ({
        name: i.itemName,
        value: i.totalQuantitySold,
        Revenue: i.totalRevenueGenerated
    }));

    return (
        <div className="space-y-6 dashboard-content p-6 bg-gray-50 min-h-screen">
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-6 no-print bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Comprehensive Reports</h2>
                        <p className="text-gray-500 text-sm mt-1 capitalize">Showing data for: <span className="text-indigo-600 font-bold">{filter === 'custom' ? 'Selected Date Range' : filter === 'all' ? 'All Time' : `Past ${filter}`}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                            City Filter:
                            <input
                                type="text"
                                placeholder="e.g. Nagpur"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="ml-2 bg-transparent outline-none w-28 text-gray-900 placeholder:font-normal"
                            />
                        </span>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm flex items-center gap-2">
                        <Printer className="w-5 h-5" />
                        Print Report
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-extrabold text-[#e23744]">DigiEats</h1>
                <h2 className="text-xl font-bold mt-2">Comprehensive Platform Report</h2>
                <p className="text-sm text-gray-500 mt-1 capitalize">Period: {filter === 'custom' ? 'Selected Date Range' : filter === 'all' ? 'All Time' : `Past ${filter}`}</p>
                {cityFilter && <p className="text-sm text-gray-500 mt-1 capitalize">Region: {cityFilter}</p>}
                <p className="text-sm text-gray-500 mt-1">Generated on: {new Date().toLocaleString()}</p>
            </div>

            {/* Summary Highlights */}
            {detailedReports.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-gray-500 font-medium mb-1">Total Active Restaurants</p>
                        <p className="text-4xl font-extrabold text-orange-600">{(detailedReports.metrics?.totalRestaurantsCount || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-gray-500 font-medium mb-1">Total Ordering Customers</p>
                        <p className="text-4xl font-extrabold text-blue-600">{(detailedReports.metrics?.totalUsersCount || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-gray-500 font-medium mb-1">Total Menu Items</p>
                        <p className="text-4xl font-extrabold text-emerald-600">{(detailedReports.metrics?.totalDishesCount || 0).toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top 10 Restaurants Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Top 10 Restaurants by Revenue</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shopChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} formatter={(value) => `₹${(value || 0).toLocaleString()}`} />
                                <Bar dataKey="Revenue" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 10 Food Items Pie Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Top 10 Most Ordered Items</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={itemChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {itemChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name, props) => [`${value || 0} Units (₹${(props.payload.Revenue || 0).toLocaleString()})`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Comprehensive Tables Section */}
            <div className="space-y-8">
                {/* Restaurants Full Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden print-break-inside-avoid">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">All Restaurants Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-lg">Rank</th>
                                    <th className="py-3 px-4">Restaurant Name</th>
                                    <th className="py-3 px-4">Contact Email</th>
                                    <th className="py-3 px-4">Total Orders</th>
                                    <th className="py-3 px-4 rounded-tr-lg">Gross Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detailedReports.shops.map((shop, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="py-3 px-4 text-gray-500 font-medium">#{idx + 1}</td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">{shop.shopName}</td>
                                        <td className="py-3 px-4 text-gray-500">{shop.shopEmail}</td>
                                        <td className="py-3 px-4 text-indigo-600 font-medium">{shop.totalOrders}</td>
                                        <td className="py-3 px-4 text-emerald-600 font-bold">₹{(shop.totalRevenue || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {detailedReports.shops.length === 0 && (
                                    <tr><td colSpan="5" className="py-4 text-center text-gray-500">No data available for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Users Full Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden print-break-inside-avoid">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">All Customers Leaderboard</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-lg">Rank</th>
                                    <th className="py-3 px-4">Customer Name</th>
                                    <th className="py-3 px-4">Email</th>
                                    <th className="py-3 px-4">Total Orders</th>
                                    <th className="py-3 px-4 rounded-tr-lg">Total Spent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detailedReports.users.map((user, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="py-3 px-4 text-gray-500 font-medium">#{idx + 1}</td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">{user.userName}</td>
                                        <td className="py-3 px-4 text-gray-500">{user.userEmail}</td>
                                        <td className="py-3 px-4 text-indigo-600 font-medium">{user.totalOrdersMade}</td>
                                        <td className="py-3 px-4 text-emerald-600 font-bold">₹{(user.totalAmountSpent || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {detailedReports.users.length === 0 && (
                                    <tr><td colSpan="5" className="py-4 text-center text-gray-500">No data available for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Food Items Full Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden print-break-inside-avoid">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">All Ordered Food Items</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-lg">Rank</th>
                                    <th className="py-3 px-4">Item Name</th>
                                    <th className="py-3 px-4">Quantity Sold</th>
                                    <th className="py-3 px-4 rounded-tr-lg">Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detailedReports.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="py-3 px-4 text-gray-500 font-medium">#{idx + 1}</td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">{item.itemName}</td>
                                        <td className="py-3 px-4 text-indigo-600 font-medium">{item.totalQuantitySold}</td>
                                        <td className="py-3 px-4 text-emerald-600 font-bold">₹{(item.totalRevenueGenerated || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {detailedReports.items.length === 0 && (
                                    <tr><td colSpan="4" className="py-4 text-center text-gray-500">No data available for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

