import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import DeliveryBoyTracking from './DeliveryBoyTracking'
import { ClipLoader } from 'react-spinners'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import { FaStore, FaMapMarkerAlt, FaRoute, FaCheckCircle, FaRupeeSign, FaBoxOpen } from "react-icons/fa"
import { MdOutlineDeliveryDining, MdPhone } from "react-icons/md"

function DeliveryBoy() {
  const { userData, socket, myOrders } = useSelector(state => state.user)
  const [currentOrder, setCurrentOrder] = useState()
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [isOnline, setIsOnline] = useState(userData?.isOnline || false)
  const isOnlineRef = React.useRef(isOnline);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    if (userData?.isOnline !== undefined) {
      setIsOnline(userData.isOnline)
    }
  }, [userData])

  const toggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      setIsOnline(newStatus); // optimistic update
      const result = await axios.post(`${serverUrl}/api/user/toggle-online`, { isOnline: newStatus }, { withCredentials: true })
      if (result.data.isOnline !== undefined) {
        setIsOnline(result.data.isOnline);
      }
      toast.success(newStatus ? "You are now ONLINE 🟢" : "You are now OFFLINE 🔴", {
        icon: newStatus ? '🛵' : '💤'
      });
    } catch (error) {
      console.log(error);
      setIsOnline(!isOnline); // revert
      toast.error("Failed to update status");
    }
  }
  const [showLifetime, setShowLifetime] = useState(false)
  const [availableAssignments, setAvailableAssignments] = useState(null)
  const [otp, setOtp] = useState("")
  const [timeframe, setTimeframe] = useState('daily') // 'daily', 'weekly', 'monthly'
  const [performanceData, setPerformanceData] = useState({ deliveries: [], chartData: [] })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null)

  useEffect(() => {
    if (!socket || userData.role !== "deliveryBoy") return
    let watchId
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        setDeliveryBoyLocation({ lat: latitude, lon: longitude })
        socket.emit('updateLocation', {
          latitude,
          longitude,
          userId: userData._id
        })
      },
        (error) => {
          console.log(error)
        },
        {
          enableHighAccuracy: true
        }
      )
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }

  }, [socket, userData])

  const ratePerDelivery = 50
  const totalEarning = performanceData.deliveries.length * ratePerDelivery
  const totalOrdersCount = performanceData.deliveries.length

  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true })
      setAvailableAssignments(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true })
      setCurrentOrder(result.data)
    } catch (error) {
      console.log(error)
      setCurrentOrder(null)
    }
  }

  const acceptOrder = async (assignmentId) => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`, { withCredentials: true })
      toast.success("Order Accepted Successfully!")
      await getCurrentOrder()
    } catch (error) {
      console.log(error)
      toast.error("Failed to accept order")
    }
  }

  useEffect(() => {
    if (!socket) return;

    const handleNewAssignment = (data) => {
      if (!isOnlineRef.current) return;

      // Play a tiny notification sound or just use toast
      toast.custom((t) => (
        <div className="bg-white px-6 py-4 shadow-xl border-l-4 border-green-500 rounded-lg flex gap-4 items-center animate-enter">
          <MdOutlineDeliveryDining className="text-3xl text-green-500 animate-bounce" />
          <div>
            <p className="font-bold text-gray-800">New Delivery Alert!</p>
            <p className="text-sm text-gray-500">New order from {data?.shopName}</p>
          </div>
        </div>
      ), { duration: 5000 })
      setAvailableAssignments(prev => ([...prev, data]))
    }

    // NEW: Listen for owner forcefully completing the delivery
    const handleOwnerDelivered = ({ orderId }) => {
      // If the Delivery Boy is active on this trip, clear it
      if (currentOrder && currentOrder._id === orderId) {
        toast.success("Order status was updated by Restaurant/Admin. Trip cleared.", { icon: '✅', duration: 5000 })
        setCurrentOrder(null)
        setShowOtpBox(false)
        setOtp("")
        handlePerformanceData()
        getAssignments()
      } else {
        // Also refresh list if we are just browsing so available broadcasted ones vanish if completed
        handlePerformanceData()
        getAssignments()
      }
    }

    socket.on('newAssignment', handleNewAssignment)
    socket.on('deliveryCompletedByOwner', handleOwnerDelivered)

    return () => {
      socket.off('newAssignment', handleNewAssignment)
      socket.off('deliveryCompletedByOwner', handleOwnerDelivered)
    }
  }, [socket, currentOrder]) // Added currentOrder to dependencies for handleOwnerDelivered

  const sendOtp = async () => {
    setLoading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/order/send-delivery-otp`, {
        orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id
      }, { withCredentials: true })
      setLoading(false)
      setShowOtpBox(true)

      if (result.data.testOtp) {
        toast.success(`Delivery OTP: ${result.data.testOtp}`, {
          duration: 8000,
          icon: '📦',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } else {
        toast.success("OTP sent to customer");
      }
    } catch (error) {
      console.log(error)
      // Display specific failure reason from backend (e.g. wrong location distance)
      const errorMsg = error.response?.data?.message || "Failed to generate OTP"
      toast.error(errorMsg, {
        duration: 5000,
        icon: '⚠️',
      })
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setMessage("")
    try {
      const result = await axios.post(`${serverUrl}/api/order/verify-delivery-otp`, {
        orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id, otp
      }, { withCredentials: true })
      toast.success("Order Delivered! 🎉", { icon: '🏆' })
      setMessage(result.data.message)
      setCurrentOrder(null)
      setShowOtpBox(false)
      setOtp("")
      handlePerformanceData()
      getAssignments()
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Invalid OTP")
    }
  }

  const handlePerformanceData = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-delivery-performance?timeframe=${timeframe}`, { withCredentials: true })
      setPerformanceData(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getAssignments()
    getCurrentOrder()
  }, [userData])

  useEffect(() => {
    handlePerformanceData()
  }, [timeframe, userData])

  return (
    <div className='w-screen min-h-screen flex flex-col bg-[#f5f5f6] overflow-x-hidden font-sans'>
      <Nav />
      {/* Top Banner / Status App Bar */}
      <div className="bg-[#e23744] text-white pt-6 pb-20 px-4 shadow-md w-full relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className='text-3xl font-extrabold tracking-tight'>Delivery Boy</h1>
              <div className="mt-3 flex items-center gap-3 border border-white/20 bg-white/10 px-4 py-2 rounded-2xl w-fit">
                <span className={`text-sm font-bold tracking-wider ${isOnline ? 'text-green-300' : 'text-gray-300'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                <button
                  onClick={toggleOnline}
                  className={`w-14 h-7 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${isOnline ? 'bg-green-500' : 'bg-gray-400/80'
                    }`}
                  title="Click to toggle availability"
                  aria-label="Toggle Online Status"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-300 ease-in-out shadow-md ${isOnline ? 'translate-x-[30px]' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-right cursor-pointer hover:bg-white/20 transition-colors group"
                onClick={() => setShowLifetime(!showLifetime)}
                title="Click to toggle"
              >
                <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 flex items-center justify-end gap-1">
                  {showLifetime ? 'Lifetime Deliveries' : "Today's Deliveries"} <span className="text-[8px] opacity-50 group-hover:opacity-100 transition-opacity">▼</span>
                </p>
                <p className="text-xl font-bold flex items-center justify-end gap-1">
                  <FaCheckCircle className="text-sm opacity-80 text-green-300" />
                  {showLifetime
                    ? (myOrders?.filter(o => o.shopOrders?.status === 'delivered').length || 0)
                    : (myOrders?.filter(o => {
                      if (o.shopOrders?.status !== 'delivered') return false;
                      const d = new Date(o.createdAt);
                      const today = new Date();
                      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                    }).length || 0)
                  }
                </p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right shadow-inner">
                <p className="text-xs uppercase tracking-wider font-extrabold opacity-90 text-green-50">Today's Earnings</p>
                <p className="text-2xl font-black flex items-center justify-end text-white">₹{totalEarning}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Shifted up with negative margin */}
      <div className='w-full max-w-4xl mx-auto px-4 -mt-10 pb-20 space-y-6'>

        {/* Active Delivery takes absolute priority if exists */}
        {currentOrder && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 relative overflow-hidden ring-4 ring-green-500/10">
            {/* Background design accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-0"></div>

            <div className='flex justify-between items-start mb-6 relative z-10'>
              <div>
                <span className='bg-green-100 text-green-700 font-bold px-3 py-1 rounded-md text-xs tracking-wider uppercase inline-flex items-center gap-1.5 mb-3'>
                  <FaCheckCircle className="text-sm" /> Active Trip
                </span>
                <h2 className='text-2xl font-bold text-gray-900'>Deliver to {currentOrder.user.fullName}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <a href={`tel:${currentOrder.user.mobile}`} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-1.5 px-3 rounded-lg text-sm transition-colors border border-gray-200">
                    <MdPhone className="text-green-600" size={16} /> Call {currentOrder.user.mobile}
                  </a>
                </div>
                <p className="text-gray-500 font-medium flex items-center gap-1.5 mt-3">
                  <FaBoxOpen className="text-[#e23744]" /> {currentOrder.shopOrder.shopOrderItems.length} Items &bull; {currentOrder.shopOrder.subtotal}
                </p>
              </div>
            </div>

            {/* Stepper UI for Pickup -> Dropoff */}
            <div className="relative pl-4 mb-8 border-l-2 border-dashed border-gray-300 ml-4 space-y-8 mt-6">
              {/* Step 1: Pickup */}
              <div className="relative">
                <div className="absolute -left-[25px] top-1 h-6 w-6 rounded-full bg-white border-4 border-orange-500 flex items-center justify-center"></div>
                <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider">Pickup From</h3>
                <p className="text-lg font-bold text-gray-800 flex items-center gap-2 mt-1">
                  <FaStore className="text-orange-500" /> {currentOrder.shopName || currentOrder.shopOrder.shop.name}
                </p>
              </div>

              {/* Step 2: Drop off */}
              <div className="relative">
                <div className="absolute -left-[25px] top-1 h-6 w-6 rounded-full bg-white border-4 border-green-500 flex items-center justify-center"></div>
                <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider">Deliver To (Customer Address)</h3>
                <p className="text-lg font-bold text-gray-800 flex items-center gap-2 mt-1">
                  <FaMapMarkerAlt className="text-green-500" /> {currentOrder.deliveryAddress.text}
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Detailed Address</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{currentOrder.deliveryAddress.text}</p>
                </div>
              </div>
            </div>

            {/* Premium Tracking Map */}
            <div className="w-full mb-8">
              <DeliveryBoyTracking data={{
                deliveryBoyLocation: deliveryBoyLocation || {
                  lat: userData.location.coordinates[1],
                  lon: userData.location.coordinates[0]
                },
                shopLocation: currentOrder.shopLocation,
                customerLocation: {
                  lat: currentOrder.deliveryAddress.latitude,
                  lon: currentOrder.deliveryAddress.longitude
                }
              }} />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100">
              {!showOtpBox ? (
                <button
                  className='w-full bg-[#1c1c1c] text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-black/10 hover:bg-black active:scale-[0.98] transition-all duration-200 uppercase tracking-widest text-lg flex items-center justify-center gap-3'
                  onClick={sendOtp}
                  disabled={loading}
                >
                  {loading ? <ClipLoader size={24} color='white' /> : <>Mark As Delivered <FaCheckCircle /></>}
                </button>
              ) : (
                <div className='p-6 border-2 border-green-100 rounded-2xl bg-green-50/50 shadow-inner'>
                  <p className='text-sm font-semibold mb-4 text-gray-700 text-center'>Ask <span className='text-[#e23744] font-bold text-base'>{currentOrder.user.fullName}</span> for the delivery OTP</p>

                  <div className="flex gap-4 mb-6">
                    <input
                      type="text"
                      className='flex-1 border-2 border-gray-200 focus:border-[#e23744] px-4 py-4 text-center text-3xl tracking-[0.4em] rounded-xl outline-none font-black bg-white shadow-sm transition-colors'
                      placeholder='----'
                      maxLength={4}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      value={otp}
                    />
                  </div>

                  <button
                    className="w-full bg-[#e23744] text-white py-4 rounded-xl font-bold hover:bg-[#cb202d] shadow-lg active:scale-[0.98] transition-all uppercase tracking-wide text-lg flex justify-center items-center gap-2"
                    onClick={verifyOtp}
                    disabled={otp.length !== 4}
                  >
                    Confirm Delivery
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Assignments / Radar Box */}
        {!currentOrder && isOnline && (
          <div className='bg-white rounded-3xl p-6 shadow-sm border border-gray-200'>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FaRoute className="text-orange-600 text-xl" />
              </div>
              <h1 className='text-xl font-bold text-gray-800'>Available Deliveries</h1>
            </div>

            <div className='space-y-4'>
              {availableAssignments?.length > 0 ? (
                availableAssignments.map((a, index) => (
                  <div className='border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between md:items-center hover:shadow-md transition-shadow bg-gray-50/50' key={index}>
                    <div className="mb-4 md:mb-0">
                      <p className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                        <FaStore className="text-gray-400" /> {a?.shopName}
                      </p>
                      <p className='text-sm text-gray-500 mt-2 flex items-start gap-2 max-w-sm leading-relaxed'>
                        <FaMapMarkerAlt className="text-red-400 mt-1 flex-shrink-0" /> {a?.deliveryAddress.text}
                      </p>
                      <div className="flex gap-4 mt-3">
                        <span className='text-xs font-bold text-gray-600 bg-gray-200 px-3 py-1 rounded-full'>{a.items.length} items</span>
                        <span className='text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full'>{a.subtotal}</span>
                      </div>
                    </div>
                    <button
                      className='bg-[#e23744] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-[#cb202d] hover:shadow-lg active:scale-95 transition-all w-full md:w-auto'
                      onClick={() => acceptOrder(a.assignmentId)}
                    >
                      Accept Order
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MdOutlineDeliveryDining className="text-5xl text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">Looking for nearby orders...</h3>
                  <p className='text-gray-400 text-sm mt-2 max-w-xs'>Keep your app open and stay in a high-demand area to get more orders.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Offline View */}
        {!currentOrder && !isOnline && (
          <div className='bg-white rounded-3xl p-8 shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center min-h-[300px]'>
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MdOutlineDeliveryDining className="text-5xl text-gray-300" />
            </div>
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>You are Offline</h2>
            <p className='text-gray-500 max-w-md'>Go online to start receiving delivery orders and earning money.</p>
            <button
              onClick={toggleOnline}
              className="mt-6 bg-[#e23744] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#cb202d] hover:-translate-y-1 transition-all"
            >
              Go Online Now
            </button>
          </div>
        )}

        {/* Stats Section / Performance */}
        <div className='bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 mt-6'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
            <h1 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
              <FaRupeeSign className="text-gray-400" /> My Performance
            </h1>

            {/* Timeframe Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner w-full md:w-auto">
              {['daily', 'weekly', 'monthly'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 ${timeframe === tf
                    ? 'bg-white text-[#e23744] shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-center items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-sm text-gray-500 font-bold uppercase tracking-wider relative z-10">{timeframe} Deliveries</span>
              <span className="text-4xl font-black text-gray-800 mt-2 relative z-10">{totalOrdersCount}</span>
            </div>
            <div className="flex-1 bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col justify-center items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-sm text-green-600 font-bold uppercase tracking-wider relative z-10">{timeframe} Earnings</span>
              <span className="text-4xl font-black text-green-700 mt-2 relative z-10">₹{totalEarning}</span>
            </div>
          </div>

          {performanceData.chartData.length > 0 ? (
            <div className="h-64 mt-4 w-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                    tickFormatter={(label) => timeframe === 'daily' ? `${label}:00` : label}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(value) => [value, "orders"]}
                    labelFormatter={label => timeframe === 'daily' ? `${label}:00` : label}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill='url(#colorGradient)' radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {/* Add gradient def inside the chart if needed, or just use a nice solid color */}
                  </Bar>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e23744" />
                      <stop offset="100%" stopColor="#cb202d" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 mt-4 w-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 rounded-3xl flex flex-col items-center justify-center text-gray-400 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                <MdOutlineDeliveryDining className="text-4xl text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 text-lg">No deliveries yet for this {timeframe}</p>
              <p className="text-sm text-gray-400 mt-1 max-w-[250px] text-center">Keep pushing! Your next trip is right around the corner.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default DeliveryBoy
