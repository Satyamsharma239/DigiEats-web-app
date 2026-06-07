import axios from 'axios';
import React from 'react'
import { MdPhone, MdLocationOn, MdDeliveryDining, MdRestaurant } from "react-icons/md";
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';
import { useState } from 'react';

const STATUS_OPTIONS = [
    { value: '', label: 'Change Status' },
    { value: 'pending', label: '🕐 Pending' },
    { value: 'preparing', label: '🍳 Preparing' },
    { value: 'out of delivery', label: '🛵 Out for Delivery' },
    { value: 'delivered', label: '✅ Delivered' },
]

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    preparing: 'bg-orange-100 text-orange-700 border-orange-200',
    'out of delivery': 'bg-blue-100 text-blue-700 border-blue-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
}

function OwnerOrderCard({ data }) {
    const [availableBoys, setAvailableBoys] = useState([])
    const [updating, setUpdating] = useState(false)
    const dispatch = useDispatch()

    const handleUpdateStatus = async (orderId, shopId, status) => {
        if (!status) return
        try {
            setUpdating(true)
            const result = await axios.post(
                `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
                { status },
                { withCredentials: true }
            )
            // Fix: pass shopId as string to match Redux compare
            dispatch(updateOrderStatus({ orderId, shopId: String(shopId), status }))
            setAvailableBoys(result.data.availableBoys || [])
        } catch (error) {
            console.log(error)
            alert('Failed to update status. Please try again.')
        } finally {
            setUpdating(false)
        }
    }

    const shopOrder = data.shopOrders
    const currentStatusColor = statusColors[shopOrder?.status] || 'bg-gray-100 text-gray-600 border-gray-200'

    return (
        <div className='bg-white rounded-2xl shadow-md border border-gray-100 p-5 space-y-4 hover:shadow-lg transition-shadow duration-300'>

            {/* Header: Customer Info */}
            <div className='flex justify-between items-start border-b border-gray-100 pb-3'>
                <div>
                    <h2 className='text-lg font-bold text-gray-800'>{data.user?.fullName}</h2>
                    <p className='text-sm text-gray-500'>{data.user?.email}</p>
                    <p className='flex items-center gap-1 text-sm text-gray-600 mt-1'>
                        <MdPhone className='text-[#ff4d2d]' />
                        <span>{data.user?.mobile}</span>
                    </p>
                </div>
                <div className='text-right'>
                    {data.paymentMethod === 'online' ? (
                        <p className={`text-xs font-bold px-2 py-1 rounded-full border ${data.payment ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {data.payment ? '💳 Paid Online' : '⏳ Payment Pending'}
                        </p>
                    ) : (
                        <p className='text-xs font-bold px-2 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-200'>COD</p>
                    )}
                    <p className='text-sm font-bold text-gray-800 mt-1'>₹{shopOrder?.subtotal}</p>
                </div>
            </div>

            {/* Delivery Address */}
            <div className='flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl'>
                <MdLocationOn className='text-[#ff4d2d] mt-0.5 flex-shrink-0' size={18} />
                <div>
                    <p className='font-semibold text-gray-700'>Delivery Address</p>
                    <p>{data?.deliveryAddress?.text}</p>
                </div>
            </div>

            {/* Items */}
            <div>
                <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Items</p>
                <div className='flex space-x-3 overflow-x-auto pb-2'>
                    {shopOrder?.shopOrderItems?.map((item, index) => (
                        <div key={index} className='flex-shrink-0 w-36 border border-gray-100 rounded-xl p-2 bg-white shadow-sm'>
                            <img src={item.item?.image} alt="" className='w-full h-20 object-cover rounded-lg mb-1' />
                            <p className='text-sm font-semibold truncate'>{item.name}</p>
                            <p className='text-xs text-gray-500'>Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status + Update */}
            <div className='flex flex-wrap gap-3 items-center justify-between pt-3 border-t border-gray-100'>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${currentStatusColor}`}>
                    {shopOrder?.status?.toUpperCase() || 'PENDING'}
                </span>

                {shopOrder?.status !== 'delivered' && shopOrder?.status !== 'cancelled' && (
                    <div className='flex items-center gap-2'>
                        {updating && <span className='text-xs text-gray-400 animate-pulse'>Updating...</span>}
                        <select
                            className='rounded-xl border border-[#ff4d2d] px-3 py-1.5 text-sm text-[#ff4d2d] font-semibold focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer bg-white'
                            onChange={(e) => handleUpdateStatus(data._id, shopOrder?.shop?._id, e.target.value)}
                            disabled={updating}
                            defaultValue=""
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Delivery Boy Assignment Panel */}
            {(shopOrder?.status === 'out of delivery') && (
                <div className='p-3 border border-blue-100 rounded-xl bg-blue-50'>
                    <div className='flex items-center gap-2 mb-2'>
                        <MdDeliveryDining className='text-blue-600' size={20} />
                        <p className='text-sm font-semibold text-blue-700'>
                            {shopOrder?.assignedDeliveryBoy ? 'Assigned Delivery Partner' : 'Searching Delivery Partner...'}
                        </p>
                    </div>
                    {availableBoys?.length > 0 ? (
                        <div className='space-y-1'>
                            {availableBoys.map((b, index) => (
                                <div key={index} className='text-sm text-gray-700 flex items-center gap-2'>
                                    <span className='font-semibold'>{b.fullName}</span>
                                    <span className='text-gray-500'>· {b.mobile}</span>
                                </div>
                            ))}
                        </div>
                    ) : shopOrder?.assignedDeliveryBoy ? (
                        <p className='text-sm text-gray-700 font-medium'>
                            {shopOrder.assignedDeliveryBoy?.fullName} · {shopOrder.assignedDeliveryBoy?.mobile}
                        </p>
                    ) : (
                        <p className='text-sm text-gray-500 italic'>Looking for nearby delivery partners...</p>
                    )}
                </div>
            )}

            {/* Delivered Badge */}
            {shopOrder?.status === 'delivered' && (
                <div className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl'>
                    <span className='text-green-600 text-xl'>✅</span>
                    <p className='text-sm font-semibold text-green-700'>Order delivered successfully!</p>
                </div>
            )}
        </div>
    )
}

export default OwnerOrderCard
