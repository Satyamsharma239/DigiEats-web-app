import React from 'react'
import { FaLeaf, FaDrumstickBite, FaStar, FaRegStar, FaMinus, FaPlus } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { addToCart, removeFromCart } from '../redux/userSlice';

function FoodCard({ data }) {
  const dispatch = useDispatch()
  const navigate = useNavigate() // 2. Initialize navigate
  const { cartItems } = useSelector(state => state.user)

  // Check if item is in cart
  const cartItem = cartItems.find(item => item.id === data._id);
  const qty = cartItem ? cartItem.quantity : 0;

  // Render Stars
  const renderStars = (rating) => {
    const validRating = rating || 4;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        (i <= validRating) ? (
          <FaStar key={i} className='text-yellow-400 text-sm' />
        ) : (
          <FaRegStar key={i} className='text-gray-300 text-sm' />
        )
      )
    }
    return stars
  }

  const handleAdd = (e) => {
    e.stopPropagation(); // Prevent going to shop page when clicking ADD
    dispatch(addToCart({
      id: data._id,
      name: data.name,
      price: data.price,
      image: data.image,
      shop: data.shop,
      quantity: 1,
      foodType: data.foodType
    }))
  }

  const handleIncrease = (e) => {
    e.stopPropagation(); // Prevent going to shop page
    dispatch(addToCart({
      ...cartItem,
      quantity: qty + 1
    }))
  }

  const handleDecrease = (e) => {
    e.stopPropagation(); // Prevent going to shop page
    if (qty > 1) {
      dispatch(addToCart({
        ...cartItem,
        quantity: qty - 1
      }))
    } else {
      dispatch(removeFromCart({ id: data._id }))
    }
  }

  // 3. New Function to handle Image Click
  const handleCardClick = () => {
    // If data.shop is an object, use ._id, otherwise use data.shop directly
    const shopId = data.shop?._id || data.shop;
    navigate(`/shop/${shopId}`);
  }

  return (
    <div className='w-[280px] bg-white rounded-2xl overflow-hidden flex flex-col border border-gray-100 shadow-sm hover-lift group'>

      {/* 4. Added onClick to the Image Container */}
      <div
        className='relative w-full h-[180px] cursor-pointer'
        onClick={handleCardClick}
      >
        <img
          src={data.image || "https://placehold.co/400x300/e23744/white?text=Delicious+Food"}
          alt={data.name}
          className='w-full h-full object-cover transition-transform duration-300 hover:scale-105'
          onError={(e) => { e.target.src = "https://placehold.co/400x300/e23744/white?text=Delicious+Food" }}
        />

        <div className='absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-md'>
          {data.foodType === "veg" ?
            <FaLeaf className='text-green-600 text-sm' /> :
            <FaDrumstickBite className='text-red-600 text-sm' />
          }
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {/* Title is also clickable now */}
        <div className='flex justify-between items-start cursor-pointer' onClick={handleCardClick}>
          <h1 className='font-bold text-gray-900 text-[19px] leading-tight w-[70%] truncate group-hover:text-[#e23744] transition-colors'>{data.name}</h1>

          <div className='flex items-center gap-1 bg-green-700 px-1.5 py-0.5 rounded-md'>
            <span className='font-bold text-xs text-white'>{data.rating?.average || 4.2}</span>
            <FaStar className='text-white text-[10px]' />
          </div>
        </div>

        <p className='text-xs text-gray-500 truncate'>{data.description || "Delicious food prepared with love."}</p>

        <div className='flex items-center justify-between mt-3'>
          <span className='font-bold text-gray-900 text-xl'>₹{data.price}</span>

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className='bg-red-50 border border-[#e23744]/20 text-[#e23744] px-8 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#e23744] hover:text-white transition-all uppercase'
            >
              ADD
            </button>
          ) : (
            <div className='flex items-center bg-[#e23744] rounded-lg overflow-hidden shadow-sm'>
              <button className='px-3 py-2 hover:bg-[#cb202d] text-white transition' onClick={handleDecrease}>
                <FaMinus size={10} />
              </button>
              <span className='px-2 text-sm font-bold text-white'>{qty}</span>
              <button className='px-3 py-2 hover:bg-[#cb202d] text-white transition' onClick={handleIncrease}>
                <FaPlus size={10} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FoodCard