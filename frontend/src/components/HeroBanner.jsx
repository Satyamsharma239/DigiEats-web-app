import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function HeroBanner() {
    const navigate = useNavigate();
    const { myOrders } = useSelector(state => state.user);

    // If the user has orders, we shouldn't show the "First Order" 50% off banner
    if (myOrders && myOrders.length > 0) {
        return null;
    }

    return (
        <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-lg relative h-[250px] md:h-[320px] mb-6 group cursor-pointer animate-fade-in-down">
            {/* Background Image with Overlay */}
            <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
                alt="Delicious Food"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-center px-8 md:px-16">
                <span className="bg-[#e23744] text-white text-xs md:text-sm font-bold px-3 py-1 rounded-full w-max mb-3 tracking-wide shadow-md">
                    LIMITED TIME OFFER
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight drop-shadow-lg">
                    Get 50% OFF <br className="hidden md:block" />
                    <span className="text-[#ffb7b2]">on your first order!</span>
                </h1>
                <p className="text-gray-200 text-sm md:text-base mb-6 max-w-md drop-shadow-md">
                    Explore the best restaurants in your city and get your favorite meals delivered fresh and fast.
                </p>
                <button
                    onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}
                    className="bg-white text-[#e23744] font-bold py-3 mx-auto md:mx-0 px-8 rounded-full shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all transform hover:-translate-y-1 w-max active:scale-95"
                >
                    Order Now
                </button>
            </div>
        </div>
    );
}

export default HeroBanner;
