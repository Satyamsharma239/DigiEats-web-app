import React, { useEffect, useState } from 'react'
import Nav from './Nav.jsx';
import { useSelector } from 'react-redux'
import { FaUtensils, FaMapMarkerAlt, FaPlus, FaCamera, FaChartLine, FaShoppingBag, FaWallet } from "react-icons/fa";
import { FaPen } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import OwnerItemCard from './ownerItemCard';
import axios from 'axios';
import { serverUrl } from '../App';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function OwnerDashboard() {
  const { myShopData } = useSelector(state => state.owner)
  const navigate = useNavigate()
  const [timeframe, setTimeframe] = useState('daily')
  const [performance, setPerformance] = useState({ totalEarnings: 0, totalOrders: 0, chartData: [] })
  const [loading, setLoading] = useState(false)

  const fetchPerformance = async () => {
    setLoading(true)
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-owner-performance?timeframe=${timeframe}`, { withCredentials: true })
      setPerformance(result.data)
    } catch (error) {
      console.log("Error fetching performance:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (myShopData) {
      fetchPerformance()
    }
  }, [timeframe, myShopData])

  return (
    <div className='w-full min-h-screen bg-[#f8f9fa] flex flex-col font-sans'>
      <Nav />

      {!myShopData && (
        <div className='flex-1 flex justify-center items-center px-4 py-12'>
          <div className='w-full max-w-lg bg-white shadow-2xl shadow-gray-200/50 rounded-[2rem] p-8 md:p-12 border border-gray-100 relative overflow-hidden text-center'>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -z-0"></div>

            <div className='flex flex-col items-center relative z-10'>
              <div className='bg-orange-100 p-6 rounded-full mb-6 relative'>
                <div className="absolute top-0 right-0 h-4 w-4 bg-orange-500 rounded-full animate-ping"></div>
                <FaUtensils className='text-[#e23744] text-5xl' />
              </div>
              <h2 className='text-3xl font-black text-gray-900 mb-3 tracking-tight'>Partner With Us</h2>
              <p className='text-gray-500 mb-8 max-w-sm text-lg'>
                Join our premium food delivery platform and reach thousands of hungry customers every day.
              </p>
              <button
                className='w-full bg-[#e23744] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#e23744]/30 hover:bg-[#cb202d] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-lg uppercase tracking-wide flex items-center justify-center gap-2'
                onClick={() => navigate("/create-edit-shop")}
              >
                Register Restaurant
              </button>
            </div>
          </div>
        </div>
      )}

      {myShopData && (
        <div className='w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24'>

          {/* Dashboard Header Section */}
          <div className="flex flex-col md:flex-row items-center justify-between mt-10 mb-8 gap-4">
            <div>
              <h1 className='text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3 tracking-tight'>
                Dashboard <span className="bg-green-100 text-green-700 text-sm py-1 px-3 rounded-md uppercase tracking-widest font-bold">Online</span>
              </h1>
              <p className="text-gray-500 font-medium mt-1">Track your growth and manage your restaurant menu.</p>
            </div>

            <button
              className='bg-[#1c1c1c] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2'
              onClick={() => navigate("/add-item")}
            >
              <FaPlus /> Add New Menu Item
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Balance Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <FaWallet className="text-[#e23744] text-xl" />
                </div>
                <div className="flex gap-1">
                  {['daily', 'weekly', 'monthly'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`text-[10px] px-2 py-1 rounded-md transition-all font-bold uppercase ${timeframe === t ? 'bg-[#e23744] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {t === 'daily' ? 'Day' : t === 'weekly' ? 'Week' : 'Month'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total Earnings</p>
                <h2 className="text-4xl font-black text-gray-900">₹{performance.totalEarnings.toLocaleString()}</h2>
              </div>
            </div>

            {/* Orders Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <FaShoppingBag className="text-blue-600 text-xl" />
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Orders Delivered</p>
                <h2 className="text-4xl font-black text-gray-900">{performance.totalOrders}</h2>
              </div>
            </div>

            {/* Growth Chart Card */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 md:col-span-1 min-h-[160px]">
              <div className="flex items-center gap-2 mb-3 px-2">
                <FaChartLine className="text-green-500" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue Flow</span>
              </div>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performance.chartData}>
                    <defs>
                      <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e23744" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#e23744" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="earnings" stroke="#e23744" strokeWidth={3} fillOpacity={1} fill="url(#colorEarn)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">Visualizing sales trends for {timeframe}</p>
            </div>
          </div>

          {/* Restaurant Banner Card */}
          <div className='bg-white shadow-xl shadow-gray-200/40 rounded-3xl overflow-hidden border border-gray-100 relative group mb-12'>
            <button
              className='absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md text-gray-800 p-3 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all outline-none border border-gray-100'
              onClick={() => navigate("/create-edit-shop")}
              title="Edit Restaurant Details"
            >
              <FaPen size={18} className="text-[#e23744]" />
            </button>

            <div className="relative h-64 md:h-80 w-full bg-gray-200 overflow-hidden">
              <img src={myShopData.image} alt={myShopData.name} className='w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out' />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              <div className='absolute bottom-0 left-0 p-6 md:p-8 w-full'>
                <div className="bg-white/20 backdrop-blur-md w-max px-3 py-1 rounded-full border border-white/30 text-white text-xs font-bold tracking-wider mb-3">RESTAURANT</div>
                <h1 className='text-3xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-md'>{myShopData.name}</h1>
                <p className='text-gray-200 font-medium flex items-center gap-2 md:text-lg'>
                  <FaMapMarkerAlt className="text-[#e23744]" /> {myShopData.address}, {myShopData.city}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items Section */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className='text-2xl font-bold text-gray-900 tracking-tight'>Menu Items</h2>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">{myShopData.items.length} Total</span>
            </div>

            {myShopData.items.length === 0 ? (
              <div className='bg-white shadow-sm border border-gray-200 rounded-3xl p-10 md:p-16 flex flex-col items-center justify-center text-center mt-4'>
                <div className='w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6'>
                  <FaCamera className='text-[#e23744] text-4xl opacity-50' />
                </div>
                <h2 className='text-2xl font-bold text-gray-800 mb-2'>Your Menu is Empty</h2>
                <p className='text-gray-500 mb-8 max-w-sm'>
                  Customers can't place orders until you add food items to your menustore. Upload high-quality pictures to attract more orders!
                </p>
                <button
                  className='bg-[#e23744] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#e23744]/30 hover:bg-[#cb202d] transition-all flex items-center gap-2 uppercase tracking-wide'
                  onClick={() => navigate("/add-item")}
                >
                  <FaPlus /> Add First Item
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {myShopData.items.map((item, index) => (
                  <OwnerItemCard data={item} key={index} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}

export default OwnerDashboard
