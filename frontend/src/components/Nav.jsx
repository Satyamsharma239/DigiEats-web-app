import React, { useEffect, useState } from 'react'
import { FaLocationDot } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { useDispatch, useSelector } from 'react-redux';
import { RxCross2 } from "react-icons/rx";
import axios from 'axios';
import { serverUrl } from '../App';
import { setSearchItems, setUserData, setCurrentCity } from '../redux/userSlice';
import { FaPlus } from "react-icons/fa6";
import { TbReceipt2 } from "react-icons/tb";
import { useNavigate } from 'react-router-dom';

function Nav() {
    const { userData, currentCity, cartItems } = useSelector(state => state.user)
    const { myShopData } = useSelector(state => state.owner)
    const [showInfo, setShowInfo] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showCityModal, setShowCityModal] = useState(false)
    const [query, setQuery] = useState("")
    const [cityQuery, setCityQuery] = useState("")
    const [citySuggestions, setCitySuggestions] = useState([])
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const cities = ["Mumbai", "Vasai", "Virar", "Delhi", "Pune"];

    // --- 👇 YAHAN CHANGE KIYA HAI: ULTIMATE LOGOUT FIX 👇 ---
    const handleLogOut = async () => {
        try {
            // 1. Backend se HttpOnly Cookie delete karwane ki request
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
        } catch (error) {
            console.log("Backend logout error:", error);
        } finally {
            // 2. Browser ki saari memory saaf karo
            localStorage.clear();
            sessionStorage.clear();

            // 3. Redux Persist ki chhipi hui memory (IndexedDB) udao
            if (window.indexedDB) {
                indexedDB.deleteDatabase("persist:root");
            }

            // 4. Redux state clear
            dispatch(setUserData(null));

            // 5. Force Redirect to signin
            window.location.replace("/signin");
        }
    }
    // ---------------------------------------------------------

    const handleSearchItems = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/item/search-items?query=${query}&city=${currentCity}`, { withCredentials: true })
            dispatch(setSearchItems(result.data))
        } catch (error) {
            console.log(error)
        }
    }

    const handleCitySelect = (city) => {
        if (setCurrentCity) dispatch(setCurrentCity(city));
        setShowCityModal(false);
        setCityQuery("");
        setCitySuggestions([]);
    }

    useEffect(() => {
        if (query) {
            handleSearchItems()
        } else {
            dispatch(setSearchItems(null))
        }

    }, [query])

    useEffect(() => {
        const fetchCities = async () => {
            if (cityQuery.length > 2) {
                try {
                    const apiKey = import.meta.env.VITE_GEOAPIKEY;
                    if (apiKey) {
                        const result = await axios.get(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(cityQuery)}&type=city&format=json&apiKey=${apiKey}`);
                        const cities = result.data.results.map(r => r.city || r.county || r.state).filter(Boolean);
                        setCitySuggestions([...new Set(cities)].slice(0, 5));
                    }
                } catch (error) {
                    console.log("Autocomplete error:", error);
                }
            } else {
                setCitySuggestions([]);
            }
        };
        const timeoutId = setTimeout(fetchCities, 400);
        return () => clearTimeout(timeoutId);
    }, [cityQuery])

    // --- Location Enhancements ---
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setShowCityModal(false); // Close the popup

        // Let user know we are locating...
        if (setCurrentCity) dispatch(setCurrentCity("Locating..."));

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    const apiKey = import.meta.env.VITE_GEOAPIKEY; // Ensure this is available

                    // If API key is not available in Nav, fallback to a message or handled via useGetCity
                    if (apiKey) {
                        const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`);
                        const detectedCity = result?.data?.results[0].city || result?.data?.results[0].county || "Unknown";
                        dispatch(setCurrentCity(detectedCity));
                    } else {
                        // We might need to just let useGetCity handle the actual fetch if Nav doesn't have the API key
                        // But we can trigger the native browser prompt here
                        dispatch(setCurrentCity("Location detected. Please refresh."));
                    }
                } catch (error) {
                    console.log("Error detecting location:", error);
                    dispatch(setCurrentCity("Vasai-Virar")); // Fallback
                }
            },
            (error) => {
                console.log("Geolocation error:", error);
                dispatch(setCurrentCity("Vasai-Virar")); // Fallback if denied
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className='w-full h-[80px] flex items-center justify-between md:justify-center gap-[30px] px-[20px] fixed top-0 z-[9999] glass-effect shadow-sm overflow-visible transition-all duration-300'>

            {showSearch && userData?.role === "user" && <div className='w-[90%] h-[70px] bg-white shadow-2xl rounded-full items-center gap-[20px] flex fixed top-[90px] left-[5%] md:hidden border border-gray-100 animate-fade-in-down'>
                <div className='flex items-center w-[35%] overflow-hidden gap-[8px] px-[15px] border-r border-gray-200 cursor-pointer hover:bg-gray-50 rounded-l-full h-full' onClick={() => setShowCityModal(!showCityModal)}>
                    <FaLocationDot size={25} className=" text-[#e23744]" />
                    <div className='w-[80%] truncate text-gray-600 font-medium'>{currentCity || "Select"}</div>
                </div>
                <div className='w-[80%] flex items-center gap-[10px]'>
                    <IoIosSearch size={25} className='text-gray-400' />
                    <input type="text" placeholder='Search for restaurant, cuisine or a dish' className='px-[10px] text-gray-700 outline-0 w-full bg-transparent' onChange={(e) => setQuery(e.target.value)} value={query} />
                </div>
            </div>}

            <h1 className='text-3xl font-black mb-1 text-gradient cursor-pointer tracking-tight hover:scale-105 transition-transform' onClick={() => navigate("/")}>DigiEats</h1>

            {userData?.role === "user" && <div className='md:w-[60%] lg:w-[50%] h-[54px] bg-white shadow-sm border border-gray-200 hover:border-red-200 rounded-full items-center gap-[10px] hidden md:flex overflow-hidden hover:shadow-md transition-all duration-300'>
                <div className='flex flex-row items-center w-[30%] h-full overflow-hidden gap-[10px] px-[20px] border-r border-gray-200 hover:bg-gray-50 cursor-pointer relative' onClick={() => setShowCityModal(!showCityModal)}>
                    <FaLocationDot size={20} className=" text-[#e23744]" />
                    <input
                        className='w-[80%] truncate text-gray-700 bg-transparent outline-none cursor-pointer placeholder-gray-500'
                        placeholder="Location"
                        value={currentCity || ""}
                        readOnly
                    />
                    <div className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>
                <div className='w-[70%] h-full flex items-center gap-[10px] px-[15px]'>
                    <IoIosSearch size={24} className='text-gray-400' />
                    <input type="text" placeholder='Search for restaurant, cuisine or a dish' className='text-gray-700 outline-0 w-full h-full bg-transparent placeholder-gray-400' onChange={(e) => setQuery(e.target.value)} value={query} />
                </div>
            </div>}

            {/* City Selection Modal */}
            {showCityModal && (
                <div className='fixed top-[155px] md:top-[75px] left-[5%] md:left-[25%] lg:left-[28%] bg-white shadow-2xl rounded-xl z-[10000] border border-gray-200 w-[320px] overflow-hidden flex flex-col animate-fade-in-down'>
                    {/* Location Override Input */}
                    <div className='p-4 border-b border-gray-100 bg-gray-50 relative'>
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:border-[#e23744] focus-within:ring-1 focus-within:ring-[#e23744] transition-all">
                            <IoIosSearch size={20} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Type your city (e.g., Nallasopara)"
                                className="w-full outline-none text-gray-700 text-sm"
                                value={cityQuery}
                                onChange={(e) => setCityQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim() !== "") {
                                        handleCitySelect(e.target.value.trim());
                                    }
                                }}
                            />
                        </div>
                        {citySuggestions.length > 0 && (
                            <div className="absolute top-[65px] left-4 right-4 bg-white shadow-xl border border-gray-200 rounded-lg z-[10001] overflow-hidden">
                                {citySuggestions.map((city, idx) => (
                                    <div
                                        key={idx}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 flex items-center"
                                        onClick={() => handleCitySelect(city)}
                                    >
                                        <FaLocationDot className="inline text-gray-400 mr-2" />
                                        {city}
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Type to see suggestions or press Enter</p>
                    </div>

                    {/* Detect Location Button */}
                    <div
                        className='flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors group'
                        onClick={handleDetectLocation}
                    >
                        <div className='text-[#e23744]'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className='text-[#e23744] font-semibold text-sm'>Detect current location</p>
                            <p className='text-xs text-gray-500'>Using GPS</p>
                        </div>
                    </div>

                    {/* Popular Cities */}
                    <div className="p-2 max-h-[300px] overflow-y-auto">
                        <p className='text-xs text-gray-400 mb-2 mt-2 px-2 font-bold uppercase tracking-wider'>Popular Cities in India</p>
                        {[
                            "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata",
                            "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
                            "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad",
                            "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli",
                            "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar",
                            "Navi Mumbai", "Allahabad", "Howrah", "Ranchi", "Gwalior", "Jabalpur",
                            "Coimbatore", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati",
                            "Chandigarh", "Nallasopara"
                        ].sort().map((city) => (
                            <div
                                key={city}
                                className='py-3 px-3 hover:bg-gray-100 text-gray-700 rounded-lg cursor-pointer text-sm transition-all flex items-center gap-2'
                                onClick={() => handleCitySelect(city)}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                {city}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className='flex items-center gap-4'>
                {userData?.role === "user" && (showSearch ? <RxCross2 size={25} className='text-[#e23744] md:hidden' onClick={() => setShowSearch(false)} /> : <IoIosSearch size={25} className='text-[#e23744] md:hidden' onClick={() => setShowSearch(true)} />)
                }
                {userData?.role === "owner" ? <>
                    {myShopData && <> <button className='hidden md:flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#e23744]' onClick={() => navigate("/add-item")}>
                        <FaPlus size={20} />
                        <span>Add Food Item</span>
                    </button>
                        <button className='md:hidden flex items-center  p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#e23744]' onClick={() => navigate("/add-item")}>
                            <FaPlus size={20} />
                        </button></>}

                    <div className='hidden md:flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#e23744] font-medium' onClick={() => navigate("/my-orders")}>
                        <TbReceipt2 size={20} />
                        <span>My Orders</span>

                    </div>
                    <div className='md:hidden flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#e23744] font-medium' onClick={() => navigate("/my-orders")}>
                        <TbReceipt2 size={20} />

                    </div>
                </> : (
                    <>
                        {userData?.role === "user" && <div className='relative cursor-pointer' onClick={() => navigate("/cart")}>
                            <FiShoppingCart size={25} className='text-[#e23744]' />
                            <span className='absolute right-[-9px] top-[-12px] text-[#e23744]'>{cartItems?.length || 0}</span>
                        </div>}


                        <button className='hidden md:block px-3 py-1 rounded-lg bg-[#e23744]/10 text-[#e23744] text-sm font-medium' onClick={() => navigate("/my-orders")}>
                            My Orders
                        </button>
                    </>
                )}

                <div className='w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#e23744] text-white text-[18px] shadow-xl font-semibold cursor-pointer' onClick={() => setShowInfo(prev => !prev)}>
                    {userData?.fullName ? userData.fullName.slice(0, 1).toUpperCase() : "U"}
                </div>
                {showInfo && <div className={`fixed top-[80px] right-[10px] 
                    ${userData?.role === "deliveryBoy" ? "md:right-[20%] lg:right-[40%]" : "md:right-[10%] lg:right-[25%]"} w-[180px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999]`}>
                    <div className='text-[17px] font-semibold'>{userData?.fullName || userData?.mobile || "User"}</div>
                    {userData?.role === "user" && <div className='md:hidden text-[#e23744] font-semibold cursor-pointer' onClick={() => navigate("/my-orders")}>My Orders</div>}

                    <div className='text-[#e23744] font-semibold cursor-pointer' onClick={handleLogOut}>Log Out</div>
                </div>}

            </div>
        </div>
    )
}

export default Nav