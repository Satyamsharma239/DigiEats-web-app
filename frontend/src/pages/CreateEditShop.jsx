import React, { useEffect } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaMapMarkerAlt, FaStore } from "react-icons/fa";
import { useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { setMyShopData } from '../redux/ownerSlice';
import { ClipLoader } from 'react-spinners';
import { MapContainer, Marker, TileLayer, Popup, useMap } from 'react-leaflet'
import "leaflet/dist/leaflet.css"
import L from 'leaflet'

const storeIcon = new L.divIcon({
    html: `<div style="font-size: 30px; background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">🏪</div>`,
    className: 'custom-store-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
})

function LocationMarker({ position, setPosition }) {
    const map = useMap();
    const markerRef = React.useRef(null);

    useEffect(() => {
        if (position) {
            map.flyTo(position, 16);
        }
    }, [position, map]);

    const eventHandlers = React.useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPosition([newPos.lat, newPos.lng]);
                }
            },
        }),
        [setPosition]
    );

    return position ? (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            icon={storeIcon}
            ref={markerRef}
        >
            <Popup className="font-bold">Drag to set Store Location</Popup>
        </Marker>
    ) : null;
}

function CreateEditShop() {
    const navigate = useNavigate()
    const { myShopData } = useSelector(state => state.owner)
    const { currentCity, currentState, currentAddress, userData } = useSelector(state => state.user)

    // Auto-fill from store data or user's current location details
    const [name, setName] = useState(myShopData?.name || "")
    const [address, setAddress] = useState(myShopData?.address || currentAddress || "")
    const [city, setCity] = useState(myShopData?.city || currentCity || "")
    const [state, setState] = useState(myShopData?.state || currentState || "")

    const [frontendImage, setFrontendImage] = useState(myShopData?.image || null)
    const [backendImage, setBackendImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()

    // Default to Vasai-Virar
    const defaultCoords = [19.3917, 72.8397];
    const [mapCenter, setMapCenter] = useState(myShopData?.location?.coordinates ? [myShopData.location.coordinates[1], myShopData.location.coordinates[0]] : defaultCoords)

    useEffect(() => {
        if (myShopData?.location?.coordinates) {
            setMapCenter([myShopData.location.coordinates[1], myShopData.location.coordinates[0]])
        } else if (userData?.location?.coordinates?.length === 2) {
            setMapCenter([userData.location.coordinates[1], userData.location.coordinates[0]])
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setMapCenter([pos.coords.latitude, pos.coords.longitude])
            }, (err) => {
                console.log("Geolocation error, using Vasai-Virar", err);
                setMapCenter(defaultCoords);
            });
        }
    }, [userData, myShopData])

    // Auto-fill address details based on MapCenter
    useEffect(() => {
        const fetchAddressDetails = async () => {
            if (!mapCenter) return;
            try {
                const [lat, lon] = mapCenter;
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
                const data = await response.json()

                if (data && data.address) {
                    // Only auto-fill if the user hasn't explicitly typed something yet
                    if (!city) {
                        setCity(data.address.city || data.address.town || data.address.county || "")
                    }
                    if (!state) {
                        setState(data.address.state || "")
                    }
                    if (!address) {
                        const streetName = data.address.road || data.address.suburb || data.address.neighbourhood || ""
                        const localName = data.name || ""
                        const combined = [localName, streetName].filter(Boolean).join(", ")
                        setAddress(combined)
                    }
                }
            } catch (error) {
                console.log("Could not reverse geocode map center", error)
            }
        }

        fetchAddressDetails()
        // We purposefully only want this to run when mapCenter changes, but not overwrite user edits later.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapCenter])

    const handleImage = (e) => {
        const file = e.target.files[0]
        setBackendImage(file)
        setFrontendImage(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("city", city)
            formData.append("state", state)
            formData.append("address", address)
            formData.append("lat", mapCenter[0])
            formData.append("lon", mapCenter[1])
            if (backendImage) {
                formData.append("image", backendImage)
            }
            const result = await axios.post(`${serverUrl}/api/shop/create-edit`, formData, { withCredentials: true })
            dispatch(setMyShopData(result.data))
            setLoading(false)
            navigate("/")
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }

    return (
        <div className='flex justify-center flex-col items-center p-4 md:p-6 bg-gray-50 min-h-screen'>

            {/* Top Navigation */}
            <div className='w-full max-w-2xl flex items-center mb-6'>
                <button onClick={() => navigate("/")} className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors">
                    <IoIosArrowRoundBack size={30} className='text-gray-800' />
                </button>
            </div>

            <div className='max-w-2xl w-full bg-white shadow-xl shadow-gray-200/50 rounded-3xl p-6 md:p-10 border border-gray-100 relative overflow-hidden'>

                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-bl-[100px] -z-0"></div>

                <div className='flex flex-col items-start mb-8 relative z-10'>
                    <div className='bg-[#ff4d2d]/10 p-4 rounded-2xl mb-4'>
                        <FaStore className='text-[#ff4d2d] w-10 h-10' />
                    </div>
                    <div className="text-3xl font-black text-gray-900 tracking-tight">
                        {myShopData ? "Shop Settings" : "Register Your Store"}
                    </div>
                    <p className="text-gray-500 mt-2 font-medium">Set up your restaurant details and delivery location.</p>
                </div>

                <form className='space-y-6 relative z-10' onSubmit={handleSubmit}>

                    {/* Basic Details */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaUtensils className="text-gray-400 text-sm" /> Store Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'>Store Name</label>
                                <input type="text" placeholder="e.g. Domino's Pizza" className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff4d2d] focus:ring-1 focus:ring-[#ff4d2d] bg-white transition-all font-semibold'
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    required
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'>Store Banner Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-[180px] flex flex-col items-center justify-center overflow-hidden">
                                    <input type="file" accept='image/*' className='absolute inset-0 opacity-0 cursor-pointer z-20' onChange={handleImage} />
                                    {frontendImage ? (
                                        <img src={frontendImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10" />
                                    ) : (
                                        <div className="text-gray-400">
                                            <span className="text-3xl block mb-2">📸</span>
                                            <span className="font-semibold text-sm">Tap to upload store hero image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Details */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-gray-400 text-sm" /> Pickup Location
                        </h3>

                        {/* Auto-detected map */}
                        <div className="w-full h-[200px] bg-gray-200 rounded-xl overflow-hidden mb-6 relative border border-gray-300 shadow-inner">
                            {mapCenter ? (
                                <>
                                    <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm font-bold text-xs text-green-700 flex items-center gap-1.5 border border-green-100">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                        Auto-Targeted
                                    </div>
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={15}
                                        zoomControl={false}
                                        className="w-full h-full z-0"
                                    >
                                        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
                                        <LocationMarker position={mapCenter} setPosition={setMapCenter} />
                                    </MapContainer>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                    <ClipLoader size={20} color="#9ca3af" className="mb-2" />
                                    <span className="text-sm font-semibold">Detecting precise GPS coordinates...</span>
                                </div>
                            )}
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'>City</label>
                                <input type="text" placeholder='City Name' className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff4d2d] bg-white font-medium' onChange={(e) => setCity(e.target.value)}
                                    value={city} required />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'>State</label>
                                <input type="text" placeholder='State Name' className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff4d2d] bg-white font-medium' onChange={(e) => setState(e.target.value)}
                                    value={state} required />
                            </div>
                        </div>
                        <div>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'>Full Street Address</label>
                            <input type="text" placeholder='Shop NO. / Building / Street' className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff4d2d] bg-white font-medium' onChange={(e) => setAddress(e.target.value)}
                                value={address} required />
                        </div>
                    </div>

                    <button className='w-full bg-[#ff4d2d] text-white px-6 py-4 rounded-xl text-lg font-bold shadow-lg shadow-[#ff4d2d]/30 hover:bg-[#e64323] hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center mt-2' disabled={loading}>
                        {loading ? <ClipLoader size={24} color='white' /> : (myShopData ? "Save Changes" : "Create Store")}
                    </button>
                    <p className="text-center text-xs text-gray-400 font-medium">By creating a store, you agree to our merchant terms and conditions.</p>
                </form>
            </div>

        </div>
    )
}

export default CreateEditShop
