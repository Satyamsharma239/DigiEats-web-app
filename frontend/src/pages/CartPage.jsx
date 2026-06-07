import React from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CartItemCard from '../components/CartItemCard';
function CartPage() {
    const navigate = useNavigate()
    const { cartItems, totalAmount } = useSelector(state => state.user)
    return (
        <div className='min-h-screen bg-white flex justify-center p-6'>
            <div className='w-full max-w-[800px]'>
                <div className='flex items-center gap-[20px] mb-8 border-b pb-4'>
                    <div className=' z-[10] cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors' onClick={() => navigate("/")}>
                        <IoIosArrowRoundBack size={35} className='text-[#e23744]' />
                    </div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight text-start'>Your Cart</h1>
                </div>
                {cartItems?.length == 0 ? (
                    <p className='text-gray-500 text-lg text-center'>Your Cart is Empty</p>
                ) : (<>
                    <div className='space-y-4'>
                        {cartItems?.map((item, index) => (
                            <CartItemCard data={item} key={index} />
                        ))}
                    </div>
                    <div className='mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center'>
                        <h1 className='text-xl font-semibold text-gray-800 tracking-tight'>Total Amount</h1>
                        <span className='text-3xl font-black text-[#e23744] drop-shadow-sm'>₹{totalAmount}</span>
                    </div>
                    <div className='mt-8 flex justify-end' >
                        <button className='bg-gradient-to-r from-[#e23744] to-[#ff5252] text-white px-10 py-4 rounded-xl text-lg font-bold hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full md:w-auto' onClick={() => navigate("/checkout")}>
                            Proceed to CheckOut
                        </button>
                    </div>
                </>
                )}
            </div>
        </div>
    )
}

export default CartPage
