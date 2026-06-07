import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { serverUrl } from '../App'
import { useNavigate, useParams } from 'react-router-dom'
import { FaStore } from "react-icons/fa6";
import { FaLocationDot } from "react-icons/fa6";
import { FaUtensils } from "react-icons/fa";
import FoodCard from '../components/FoodCard';
import { FaArrowLeft } from "react-icons/fa";
function Shop() {
    const { shopId } = useParams()
    const [items, setItems] = useState([])
    const [shop, setShop] = useState([])
    const navigate = useNavigate()
    const handleShop = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/item/get-by-shop/${shopId}`, { withCredentials: true })
            setShop(result.data.shop)
            setItems(result.data.items)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        handleShop()
    }, [shopId])
    return (
        <div className='min-h-screen bg-white pb-16'>
            <button className='absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full shadow-md transition font-medium' onClick={() => navigate("/")}>
                <FaArrowLeft />
                <span>Back</span>
            </button>

            {shop && (
                <div className='relative w-full h-64 md:h-[400px]'>
                    <img
                        src={shop.image || "https://placehold.co/1200x400/e23744/white?text=Amazing+Restaurant"}
                        alt=""
                        className='w-full h-full object-cover'
                        onError={(e) => { e.target.src = "https://placehold.co/1200x400/e23744/white?text=Amazing+Restaurant" }}
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8'>
                        <h1 className='text-3xl md:text-5xl font-bold text-white tracking-tight mb-2'>{shop.name}</h1>
                        <div className='flex items-center gap-2'>
                            <FaLocationDot size={18} color='#e23744' />
                            <p className='text-lg text-gray-200'>{shop.address}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className='max-w-7xl mx-auto px-6 py-12'>
                <div className='flex items-center gap-3 mb-8 border-b pb-4'>
                    <h2 className='text-2xl font-bold text-gray-900 tracking-tight'>Order Online</h2>
                </div>

                {items.length > 0 ? (
                    <div className='flex flex-wrap justify-start gap-8'>
                        {items.map((item) => (
                            <FoodCard key={item._id} data={item} />
                        ))}
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
                        <FaUtensils size={40} className="mb-4 text-gray-300" />
                        <p className='text-xl font-medium text-gray-500'>No items available right now</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Shop
