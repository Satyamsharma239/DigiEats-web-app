import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'

function UserOrderCard({ data }) {
    const navigate = useNavigate()
    const [selectedRating, setSelectedRating] = useState({}) //itemId:rating

    // FIXED: Added hour, minute, and hour12 to show the time properly
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        })
    }

    const handleRating = async (itemId, rating) => {
        try {
            await axios.post(`${serverUrl}/api/item/rating`, { itemId, rating }, { withCredentials: true })
            setSelectedRating(prev => ({
                ...prev, [itemId]: rating
            }))
        } catch (error) {
            console.log(error)
        }
    }

    const handleCancelOrder = async (shopOrderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            const res = await axios.post(`${serverUrl}/api/order/cancel-order`, {
                orderId: data._id,
                shopOrderId
            }, { withCredentials: true });
            alert(res.data.message);
            // It will auto-update via socket if set up, otherwise we rely on MyOrders re-fetching
        } catch (error) {
            alert(error?.response?.data?.message || "Failed to cancel order");
        }
    }

    return (
        <div className='bg-white rounded-xl shadow-md border border-gray-100 p-5 space-y-4 hover:shadow-lg transition-shadow duration-300'>

            {/* Header: Order ID and Date */}
            <div className='flex justify-between items-start border-b border-gray-100 pb-3'>
                <div>
                    <div className='flex items-center gap-2'>
                        <span className='bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded'>ORDER #{data._id.slice(-6).toUpperCase()}</span>
                        {data.shopOrders?.[0]?.status === 'delivered' &&
                            <span className='bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded'>DELIVERED</span>
                        }
                    </div>
                    <p className='text-xs text-gray-500 mt-1 font-medium'>
                        Placed on {formatDate(data.createdAt)}
                    </p>
                </div>
                <div className='text-right'>
                    <p className='text-sm font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1'>₹{data.totalAmount}</p>
                    {data.itemTotal !== undefined && (
                        <div className="text-[10px] text-gray-500 font-medium leading-tight flex flex-col items-end mb-1">
                            <span>Item Total: ₹{data.itemTotal}</span>
                            <span>Handling: ₹{data.handlingCharge} | GST: ₹{data.gst}</span>
                            <span>Delivery: {data.deliveryFee === 0 ? "FREE" : `₹${data.deliveryFee}`}</span>
                        </div>
                    )}
                    <p className='text-xs text-[#e23744] font-semibold bg-red-50 px-2 py-0.5 rounded inline-block'>{data.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
                </div>
            </div>

            {/* Order Items Section */}
            {data.shopOrders.map((shopOrder, index) => (
                <div className='rounded-lg bg-gray-50 p-4 space-y-3' key={index}>
                    <div className='flex justify-between items-center'>
                        <h3 className='font-bold text-gray-800'>{shopOrder.shop.name}</h3>
                        <div className="flex items-center gap-2">
                            {['pending', 'preparing'].includes(shopOrder.status) && (
                                <button
                                    className="text-xs font-bold text-red-600 border border-red-200 bg-white px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                    onClick={() => handleCancelOrder(shopOrder._id)}
                                >
                                    Cancel
                                </button>
                            )}
                            <span className={`text-xs font-bold px-2 py-1 rounded ${shopOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                shopOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                {shopOrder.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className='flex gap-4 overflow-x-auto pb-2 scrollbar-hide'>
                        {shopOrder.shopOrderItems.map((item, idx) => (
                            <div key={idx} className='flex-shrink-0 w-[140px] bg-white border border-gray-200 rounded-lg p-2 flex flex-col'>
                                <img src={item.item.image} alt={item.name} className='w-full h-24 object-cover rounded-md mb-2' />
                                <p className='text-sm font-semibold text-gray-800 truncate'>{item.item.name}</p>
                                <p className='text-xs text-gray-500'>Qty: {item.quantity} x ₹{item.price}</p>

                                {/* Rating Stars - Only show if delivered */}
                                {shopOrder.status === "delivered" && (
                                    <div className='flex gap-0.5 mt-2 justify-center'>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                className={`text-lg transition-colors ${(selectedRating[item.item._id] || item.item.rating?.average || 0) >= star
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                                onClick={() => handleRating(item.item._id, star)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Dummy Refund Visualization */}
                    {shopOrder.status === 'cancelled' && shopOrder.refundStatus && shopOrder.refundStatus !== 'NA' && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Refund Status</p>
                                <p className="text-sm font-medium text-yellow-900 mt-0.5">₹{shopOrder.subtotal} to original payment source</p>
                            </div>
                            <span className="mt-2 sm:mt-0 bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
                                {shopOrder.refundStatus}
                            </span>
                        </div>
                    )}
                </div>
            ))}

            {/* Footer Actions */}
            <div className='flex justify-between items-center pt-2'>
                <p className='text-xs text-gray-400'>Need help with this order?</p>
                <button
                    className='bg-[#e23744] hover:bg-[#cb202d] text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all'
                    onClick={() => navigate(`/track-order/${data._id}`)}
                >
                    Track Order
                </button>
            </div>
        </div>
    )
}

export default UserOrderCard