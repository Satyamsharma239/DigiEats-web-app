import axios from 'axios'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { serverUrl } from '../App'
import { useEffect, useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io"
import { MdRestaurant, MdDeliveryDining, MdHome, MdCheckCircle, MdAccessTime } from "react-icons/md"
import { FaSpinner } from "react-icons/fa"
import DeliveryBoyTracking from '../components/DeliveryBoyTracking'
import { useSelector } from 'react-redux'

// Order status steps for the timeline
const STATUS_STEPS = [
  {
    key: 'pending',
    label: 'Order Placed',
    sublabel: 'Your order has been received',
    icon: MdAccessTime,
    color: 'orange'
  },
  {
    key: 'preparing',
    label: 'Preparing',
    sublabel: 'Restaurant is preparing your food',
    icon: MdRestaurant,
    color: 'orange'
  },
  {
    key: 'out of delivery',
    label: 'Out for Delivery',
    sublabel: 'Your order is on the way',
    icon: MdDeliveryDining,
    color: 'blue'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sublabel: 'Enjoy your meal!',
    icon: MdHome,
    color: 'green'
  }
]

function getStepIndex(status) {
  if (!status) return 0
  const s = status.toLowerCase().trim()
  if (s === 'delivered') return 3
  if (s === 'out of delivery' || s === 'out for delivery') return 2
  if (s === 'preparing') return 1
  return 0
}

function StatusTimeline({ status }) {
  const currentStep = getStepIndex(status)

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress line behind */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-1 bg-[#e23744] z-0 transition-all duration-700"
          style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
        />

        {STATUS_STEPS.map((step, idx) => {
          const Icon = step.icon
          const isCompleted = idx <= currentStep
          const isCurrent = idx === currentStep

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted
                ? 'bg-[#e23744] border-[#e23744] text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-red-100 scale-110' : ''}`}>
                {isCurrent && !isCompleted ? (
                  <FaSpinner className="animate-spin text-sm" />
                ) : (
                  <Icon size={20} />
                )}
              </div>
              <p className={`text-xs font-bold mt-2 text-center leading-tight ${isCompleted ? 'text-[#e23744]' : 'text-gray-400'}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-gray-400 text-center hidden sm:block mt-0.5 px-1">
                {step.sublabel}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const step = STATUS_STEPS.find(s => s.key === status?.toLowerCase()) || STATUS_STEPS[0]
  const colorMap = {
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200'
  }
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colorMap[step.color] || colorMap.gray}`}>
      {step.label.toUpperCase()}
    </span>
  )
}

function TrackOrderPage() {
  const { orderId } = useParams()
  const [currentOrder, setCurrentOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { socket } = useSelector(state => state.user)
  const [liveLocations, setLiveLocations] = useState({})

  const handleGetOrder = async () => {
    try {
      setLoading(true)
      const result = await axios.get(`${serverUrl}/api/order/get-order-by-id/${orderId}`, { withCredentials: true })
      setCurrentOrder(result.data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  // Real-time: listen for delivery location updates
  useEffect(() => {
    if (!socket) return
    const handleLocationUpdate = ({ deliveryBoyId, latitude, longitude }) => {
      setLiveLocations(prev => ({
        ...prev,
        [deliveryBoyId]: { lat: latitude, lon: longitude }
      }))
    }
    socket.on('updateDeliveryLocation', handleLocationUpdate)

    // Listen for incoming live OTPs
    const handleNewOtp = ({ orderId: oId, shopOrderId: sId, otp }) => {
      if (oId === orderId) {
        setCurrentOrder(prevOrder => {
          if (!prevOrder) return prevOrder;
          const newOrder = { ...prevOrder };
          const shopOrderIndex = newOrder.shopOrders.findIndex(so => String(so._id) === String(sId));
          if (shopOrderIndex > -1) {
            newOrder.shopOrders[shopOrderIndex].deliveryOtp = otp;
          }
          return newOrder;
        });
      }
    }
    socket.on('deliveryOtpGenerated', handleNewOtp)

    // Listen for status changes
    const handleStatusUpdate = ({ orderId: updatedId }) => {
      if (updatedId === orderId) {
        handleGetOrder() // Re-fetch order on status change
      }
    }
    socket.on('update-status', handleStatusUpdate)

    return () => {
      socket.off('updateDeliveryLocation', handleLocationUpdate)
      socket.off('update-status', handleStatusUpdate)
      socket.off('deliveryOtpGenerated', handleNewOtp)
    }
  }, [socket, orderId])

  useEffect(() => {
    handleGetOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-[#e23744]" size={40} />
          <p className="text-gray-500 font-medium">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Order not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/my-orders')} className="text-[#e23744] hover:scale-110 transition-transform">
            <IoIosArrowRoundBack size={35} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Track Order</h1>
            <p className="text-xs text-gray-500 font-mono">#{currentOrder._id?.slice(-10).toUpperCase()}</p>
          </div>
          <button
            onClick={handleGetOrder}
            className="ml-auto text-xs text-[#e23744] border border-[#e23744] px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-semibold"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
          <MdHome size={22} className="text-[#e23744] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Delivery Address</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{currentOrder.deliveryAddress?.text || "—"}</p>
          </div>
        </div>

        {/* Shop Orders */}
        {currentOrder.shopOrders?.map((shopOrder, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">

            {/* Shop Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-800 text-lg">{shopOrder.shop?.name}</p>
                <p className="text-sm text-gray-500">{shopOrder.shopOrderItems?.length} item(s) · ₹{shopOrder.subtotal}</p>
              </div>
              <StatusBadge status={shopOrder.status} />
            </div>

            {/* Status Timeline */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Progress</p>
              <StatusTimeline status={shopOrder.status} />
            </div>

            {/* Items List */}
            <div className="px-5 pb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Items</p>
              <div className="flex flex-wrap gap-1.5">
                {shopOrder.shopOrderItems?.map((item, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full border border-gray-200">
                    {item.quantity}× {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Delivery Boy Info & OTP Box */}
            {shopOrder.status !== 'delivered' && (
              <div className="px-5 pb-4 space-y-3">
                {shopOrder.assignedDeliveryBoy ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                        <MdDeliveryDining size={22} className="text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{shopOrder.assignedDeliveryBoy.fullName}</p>
                        <p className="text-xs text-gray-500">📞 {shopOrder.assignedDeliveryBoy.mobile}</p>
                      </div>
                    </div>

                    {/* OTP Display Box */}
                    {shopOrder.deliveryOtp && (
                      <div className="bg-white border-2 border-[#e23744] px-4 py-2 rounded-xl text-center shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">SHARE OTP</p>
                        <p className="text-xl font-black text-[#e23744] tracking-widest">{shopOrder.deliveryOtp}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                    <p className="text-sm text-orange-600 font-medium">
                      {getStepIndex(shopOrder.status) < 2
                        ? '🍳 Waiting for restaurant to prepare your order...'
                        : '🛵 Looking for a delivery partner nearby...'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Delivered Message */}
            {shopOrder.status === 'delivered' && (
              <div className="mx-5 mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <MdCheckCircle size={28} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-700">Delivered Successfully!</p>
                  <p className="text-xs text-green-600">We hope you enjoyed your meal 🎉</p>
                </div>
              </div>
            )}

            {/* Live Map */}
            {(shopOrder.assignedDeliveryBoy && shopOrder.status !== 'delivered') && (
              <div className="mx-5 mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Live Tracking</p>
                <DeliveryBoyTracking data={{
                  deliveryBoyLocation: liveLocations[shopOrder.assignedDeliveryBoy._id] || {
                    lat: shopOrder.assignedDeliveryBoy.location?.coordinates?.[1] || 19.3917,
                    lon: shopOrder.assignedDeliveryBoy.location?.coordinates?.[0] || 72.8397
                  },
                  shopLocation: shopOrder.shop?.location?.coordinates ? {
                    lat: shopOrder.shop.location.coordinates[1],
                    lon: shopOrder.shop.location.coordinates[0]
                  } : null,
                  customerLocation: {
                    lat: currentOrder.deliveryAddress?.latitude || 19.3917,
                    lon: currentOrder.deliveryAddress?.longitude || 72.8397
                  }
                }} />
              </div>
            )}

          </div>
        ))}

      </div>
    </div>
  )
}

export default TrackOrderPage
