import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import UserOrderCard from '../components/UserOrderCard';
import OwnerOrderCard from '../components/OwnerOrderCard';
import DeliveryBoyOrderCard from '../components/DeliveryBoyOrderCard';
import { setMyOrders, updateOrderStatus, updateRealtimeOrderStatus } from '../redux/userSlice';


function MyOrders() {
  const { userData, myOrders, socket } = useSelector(state => state.user)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [filterType, setFilterType] = useState('today') // 'all' or 'today'

  const getFilteredOrders = () => {
    if (!myOrders) return [];
    if (userData.role !== 'deliveryBoy') return myOrders;

    return myOrders.filter(order => {
      if (filterType === 'all') return true;
      if (filterType === 'today') {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        return (
          orderDate.getDate() === today.getDate() &&
          orderDate.getMonth() === today.getMonth() &&
          orderDate.getFullYear() === today.getFullYear()
        );
      }
      return true;
    });
  }

  const filteredOrders = getFilteredOrders();
  useEffect(() => {
    socket?.on('newOrder', (data) => {
      if (data.shopOrders?.owner._id == userData._id) {
        dispatch(setMyOrders([data, ...myOrders]))
      }
    })

    socket?.on('update-status', ({ orderId, shopId, status, userId }) => {
      if (String(userId) === String(userData._id) || userData.role === "owner" || userData.role === "deliveryBoy") {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }))
      }
    })

    socket?.on('order-cancelled', ({ orderId, shopId, status, refundStatus }) => {
      dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }))
    })

    return () => {
      socket?.off('newOrder')
      socket?.off('update-status')
      socket?.off('order-cancelled')
    }
  }, [socket])




  return (
    <div className='"w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
      <div className='w-full max-w-[800px] p-4'>

        <div className='flex items-center gap-[20px] mb-6 '>
          <div className=' z-[10] cursor-pointer hover:bg-red-50 p-1 rounded-full transition-colors' onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className='text-[#e23744]' />
          </div>
          <h1 className='text-2xl font-bold  text-start'>My Orders</h1>
          {userData.role === "deliveryBoy" && (
            <div className="ml-auto bg-green-50 px-4 py-2 rounded-xl border border-green-100 shadow-sm flex items-center gap-2">
              <span className="text-sm font-bold text-green-700">{filterType === 'all' ? 'Lifetime Orders:' : "Today's Orders:"}</span>
              <span className="text-lg font-black text-green-800">{filteredOrders.length || 0}</span>
            </div>
          )}
        </div>

        {userData.role === "deliveryBoy" && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${filterType === 'all' ? 'bg-[#e23744] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilterType('today')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${filterType === 'today' ? 'bg-[#e23744] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Today's Orders
            </button>
          </div>
        )}

        <div className='space-y-6'>
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-bold text-gray-700">No orders found</h3>
              <p className="text-gray-500 text-sm mt-1">You don't have any orders for this filter yet.</p>
            </div>
          ) : filteredOrders.map((order, index) => (
            userData.role == "user" ?
              (
                <UserOrderCard data={order} key={index} />
              )
              :
              userData.role == "owner" ? (
                <OwnerOrderCard data={order} key={index} />
              )
                :
                userData.role == "deliveryBoy" ? (
                  <DeliveryBoyOrderCard data={order} key={index} />
                )
                  :
                  null
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyOrders
