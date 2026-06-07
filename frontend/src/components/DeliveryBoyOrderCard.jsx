import React from 'react'
import { MdPhone, MdLocationOn, MdStorefront } from "react-icons/md";
import { FaCheckCircle, FaRupeeSign } from "react-icons/fa";

const statusColors = {
    'out of delivery': 'bg-blue-100 text-blue-700 border-blue-200',
    'out for delivery': 'bg-blue-100 text-blue-700 border-blue-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
}

function DeliveryBoyOrderCard({ data }) {
    const shopOrder = data?.shopOrders;

    // Normalize status string just in case
    const statusStr = shopOrder?.status?.toLowerCase() || '';
    const currentStatusColor = statusColors[statusStr] || 'bg-gray-100 text-gray-600 border-gray-200';

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

    return (
        <div className='bg-white rounded-2xl shadow-md border border-gray-100 p-5 space-y-4 hover:shadow-lg transition-shadow duration-300'>
            {/* Header: Date and Earnings */}
            <div className='flex justify-between items-start border-b border-gray-100 pb-3'>
                <div>
                    <div className='flex items-center gap-2'>
                        <span className='bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded'>ORDER #{data._id.slice(-6).toUpperCase()}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${currentStatusColor}`}>
                            {shopOrder?.status?.toUpperCase()}
                        </span>
                    </div>
                    <p className='text-xs text-gray-500 mt-1 font-medium'>
                        {shopOrder?.status === 'delivered' ? `Delivered on ${formatDate(shopOrder.deliveredAt)}` : `Placed on ${formatDate(data.createdAt)}`}
                    </p>
                </div>
                <div className='text-right'>
                    <p className='text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1'>Delivery Earning</p>
                    <p className='text-lg font-bold text-green-700 flex items-center justify-end'>
                        <FaRupeeSign className="text-sm" /> 50
                    </p>
                </div>
            </div>

            {/* Pickup & Drop Details */}
            <div className="flex flex-col gap-3 sm:flex-row">
                {/* Pickup */}
                <div className='flex-1 flex items-start gap-3 bg-orange-50 p-3 rounded-xl border border-orange-100'>
                    <div className="bg-white p-2 text-orange-500 rounded-full shadow-sm mt-0.5">
                        <MdStorefront size={18} />
                    </div>
                    <div>
                        <p className='text-xs font-bold text-orange-800 uppercase tracking-wide mb-1'>Pickup From</p>
                        <p className='font-bold text-gray-800'>{shopOrder?.shop?.name}</p>
                        {shopOrder?.shopOrderItems && (
                            <p className='text-xs text-gray-500 mt-1'>
                                {shopOrder.shopOrderItems.length} Items &bull; ₹{shopOrder.subtotal}
                            </p>
                        )}
                    </div>
                </div>

                {/* Drop */}
                <div className='flex-1 flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100'>
                    <div className="bg-white p-2 text-blue-500 rounded-full shadow-sm mt-0.5">
                        <MdLocationOn size={18} />
                    </div>
                    <div>
                        <p className='text-xs font-bold text-blue-800 uppercase tracking-wide mb-1'>Deliver To</p>
                        <p className='font-bold text-gray-800 break-words'>{data.user?.fullName}</p>
                        <p className='text-xs text-gray-600 mt-1 line-clamp-2'>{data.deliveryAddress?.text}</p>
                        <p className='flex items-center gap-1 text-xs font-semibold text-gray-700 mt-1.5'>
                            <MdPhone className='text-blue-500' /> {data.user?.mobile}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer / Delivered Status */}
            {shopOrder?.status === 'delivered' && (
                <div className='pt-2 border-t border-gray-100 flex items-center gap-2'>
                    <FaCheckCircle className='text-green-500' />
                    <p className='text-sm font-semibold text-gray-600'>Delivery completed successfully</p>
                </div>
            )}
        </div>
    )
}

export default DeliveryBoyOrderCard
