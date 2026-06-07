import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../contexts/useAdmin.js";
import axios from "axios";
import {
    Users, Store, ShoppingBag, DollarSign, Activity, TrendingUp, Printer, Calendar
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
    const { backendUrl, apiConfig, token, logout } = useAdmin();
    const [stats, setStats] = useState(null);
    const [detailedReports, setDetailedReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateFilter, setDateFilter] = useState("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = { Authorization: `Bearer ${token}` };

            let url = `${backendUrl}/dashboard-stats`;
            const params = new URLSearchParams();

            if (dateFilter !== "all" && dateFilter !== "custom") {
                const end = new Date();
                const start = new Date();
                if (dateFilter === "today") start.setHours(0, 0, 0, 0);
                if (dateFilter === "week") start.setDate(start.getDate() - 7);
                if (dateFilter === "month") start.setMonth(start.getMonth() - 1);

                params.append('startDate', start.toISOString());
                params.append('endDate', end.toISOString());
            } else if (dateFilter === "custom" && customStartDate && customEndDate) {
                params.append('startDate', new Date(customStartDate).toISOString());
                params.append('endDate', new Date(customEndDate).toISOString());
            }

            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            // Fetch basic stats
            const resStats = await axios.get(url, { headers });
            if (resStats.data.success) {
                setStats(resStats.data.stats);
            } else {
                setError("Server returned unsuccessful response for stats.");
            }

            // Fetch detailed reports separately so stats still show even if reports fail
            try {
                let detailedUrl = `${backendUrl}/detailed-reports`;
                if (queryString) {
                    detailedUrl += `?${queryString}`;
                }
                const resDetailed = await axios.get(detailedUrl, { headers });
                if (resDetailed.data.success) {
                    setDetailedReports(resDetailed.data.reports);
                }
            } catch (reportError) {
                console.error("Error fetching detailed reports:", reportError);
            }

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            // If token is expired/invalid, auto-logout and redirect to login
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                return;
            }
            const msg = err.response?.data?.message || err.message || "Unknown error";
            setError(`Failed to load statistics: ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [backendUrl, token, dateFilter, customStartDate, customEndDate, logout]);

    useEffect(() => {
        if (token) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [fetchStats, token]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;
    }

    if (!stats) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 text-lg font-medium mb-4">{error || "Failed to load statistics."}</p>
                <button
                    onClick={fetchStats}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition shadow-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Dummy chart data for visualization based on stats (in reality this would come from a timeseries DB aggregation)
    const chartData = [
        { name: 'Mon', revenue: stats.platformRevenue * 0.1 },
        { name: 'Tue', revenue: stats.platformRevenue * 0.05 },
        { name: 'Wed', revenue: stats.platformRevenue * 0.15 },
        { name: 'Thu', revenue: stats.platformRevenue * 0.2 },
        { name: 'Fri', revenue: stats.platformRevenue * 0.3 },
        { name: 'Sat', revenue: stats.platformRevenue * 0.15 },
        { name: 'Sun', revenue: stats.platformRevenue * 0.05 },
    ];

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {trend}
                </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">
                {title.includes('Revenue') ? `₹${(value || 0).toLocaleString()}` : (value || 0).toLocaleString()}
            </p>
        </div>
    );

    return (
        <div className="space-y-6 dashboard-content">
            {/* Print Header - Visible only in PDF */}
            <div className="hidden print:block mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-extrabold text-[#e23744]">DigiEats</h1>
                <h2 className="text-xl font-bold mt-2">Platform Performance Report</h2>
                <p className="text-sm text-gray-500 mt-1">Generated on: {new Date().toLocaleString()}</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-500 text-sm mt-1">Track key metrics across the DigiEats platform</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 no-print">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                        <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent text-sm text-gray-700 py-1.5 pr-8 pl-2 outline-none cursor-pointer font-medium"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {dateFilter === "custom" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => window.location.href = `/reports?filter=${dateFilter}&start=${customStartDate}&end=${customEndDate}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4" />
                            Generate Report
                        </button>
                        <button
                            onClick={fetchStats}
                            className="bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Platform Revenue (10%)"
                    value={stats.platformRevenue}
                    icon={DollarSign}
                    color="bg-emerald-500"
                    trend="+12.5%"
                />
                <StatCard
                    title="Total Gross GMV"
                    value={stats.grossRevenue}
                    icon={Activity}
                    color="bg-indigo-500"
                    trend="+8.2%"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.orders}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                    trend="+24.1%"
                />
                <StatCard
                    title="Active Restaurants"
                    value={stats.shops}
                    icon={Store}
                    color="bg-orange-500"
                    trend="+3.4%"
                />
                <StatCard
                    title="Total Customers"
                    value={stats.users}
                    icon={Users}
                    color="bg-purple-500"
                    trend="+18.7%"
                />
                <StatCard
                    title="Delivery Partners"
                    value={stats.deliveryBoys}
                    icon={Users}
                    color="bg-teal-500"
                    trend="+5.1%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Revenue Trend (This Week)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Platform Growth</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">New Users Today</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">42</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">New Restaurants Week</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">3</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                                <Store className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Orders Pending</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">14</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="w-full mt-8 bg-gray-50 text-gray-500 font-medium py-3 rounded-lg border border-gray-200 text-sm text-center">
                        Showing data for: <span className="text-indigo-600 font-bold capitalize">{dateFilter === 'custom' ? 'Selected Date Range' : dateFilter === 'all' ? 'All Time' : `Past ${dateFilter}`}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
