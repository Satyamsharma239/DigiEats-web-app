import React from 'react'
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { CiTrash } from "react-icons/ci";
import { useDispatch } from 'react-redux';
import { removeCartItem, updateQuantity } from '../redux/userSlice';
function CartItemCard({ data }) {
  const dispatch = useDispatch()
  const handleIncrease = (id, currentQty) => {
    dispatch(updateQuantity({ id, quantity: currentQty + 1 }))
  }
  const handleDecrease = (id, currentQty) => {
    if (currentQty > 1) {
      dispatch(updateQuantity({ id, quantity: currentQty - 1 }))
    }

  }
  return (
    <div className='flex flex-col sm:flex-row items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover-lift gap-4'>
      <div className='flex items-center gap-4 w-full sm:w-auto'>
        <img
          src={data.image || "https://placehold.co/100x100/e23744/white?text=Food"}
          alt={data.name || "Food Item"}
          className='w-24 h-24 object-cover rounded-xl shadow-sm border border-gray-50'
          onError={(e) => { e.target.src = "https://placehold.co/100x100/e23744/white?text=Food" }}
        />
        <div>
          <h1 className='font-medium text-gray-800'>{data.name}</h1>
          <p className='text-sm text-gray-500'>₹{data.price} x {data.quantity}</p>
          <p className="font-bold text-gray-900">₹{data.price * data.quantity}</p>
        </div>
      </div>
      <div className='flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 w-full sm:w-auto justify-between sm:justify-center'>
        <button className='p-2 cursor-pointer bg-white rounded-full hover:bg-gray-100 shadow-sm transition' onClick={() => handleDecrease(data.id, data.quantity)}>
          <FaMinus size={12} className="text-gray-600" />
        </button>
        <span className="font-semibold text-lg w-4 text-center">{data.quantity}</span>
        <button className='p-2 cursor-pointer bg-white rounded-full hover:bg-gray-100 shadow-sm transition' onClick={() => handleIncrease(data.id, data.quantity)}>
          <FaPlus size={12} className="text-gray-600" />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
        <button className="p-2 bg-red-50 text-[#e23744] rounded-full hover:bg-red-100 transition shadow-sm"
          onClick={() => dispatch(removeCartItem(data.id))}>
          <CiTrash size={20} />
        </button>
      </div>
    </div>
  )
}

export default CartItemCard
