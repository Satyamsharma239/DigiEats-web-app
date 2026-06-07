import React, { useEffect, useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { TbCurrentLocation } from "react-icons/tb";
import { IoLocationSharp } from "react-icons/io5";
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import "leaflet/dist/leaflet.css"
import { setAddress, setLocation } from '../redux/mapSlice';
import { MdDeliveryDining } from "react-icons/md";
import { FaGooglePay, FaUniversity, FaCreditCard } from "react-icons/fa";
import { SiPhonepe, SiPaytm } from "react-icons/si";
import { RiVisaLine } from "react-icons/ri";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { addMyOrder, clearCart } from '../redux/userSlice';

// Map Helper Component
function RecenterMap({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location?.lat && location?.lon) {
      map.setView([location.lat, location.lon], 16, { animate: true })
    }
  }, [location, map])
  return null
}

function CheckOut() {
  const { location, address } = useSelector(state => state.map)
  const { cartItems, totalAmount, userData, shopInMyCity, myOrders } = useSelector(state => state.user)

  const [addressInput, setAddressInput] = useState("")
  // Default is empty "" so the user MUST select one
  const [selectedMethod, setSelectedMethod] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const apiKey = import.meta.env.VITE_GEOAPIKEY

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const [currentLat, setCurrentLat] = useState(location?.lat || 19.3917);
  const [currentLon, setCurrentLon] = useState(location?.lon || 72.8397);

  // Detailed Billing Calculations
  const itemTotal = totalAmount || 0;

  // Dynamic Delivery Fee: ₹30 flat if distance < 1km, else ₹20/km
  let dynamicDeliveryFee = 0;
  if (itemTotal > 0 && cartItems && cartItems.length > 0) {
    const uniqueShopIds = [...new Set(cartItems.map(item => item.shop?._id || item.shop))];
    uniqueShopIds.forEach(shopId => {
      const shop = shopInMyCity?.find(s => s._id === shopId);
      if (shop && shop.location && shop.location.coordinates) {
        const shopLon = shop.location.coordinates[0];
        const shopLat = shop.location.coordinates[1];
        const distance = calculateDistance(currentLat, currentLon, shopLat, shopLon);

        if (distance <= 1) {
          dynamicDeliveryFee += 30; // Flat ₹30 if under 1km
        } else {
          dynamicDeliveryFee += Math.floor(distance * 20); // Only 20/km if > 1km
        }
      } else {
        dynamicDeliveryFee += 40; // Fallback fee per shop if location missing
      }
    });
  }
  // Base charges will be finalized after coupon logic

  // DigiEats Theming Colors
  const primaryColor = "#e23744";

  // CheckOut OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [paymentOtp, setPaymentOtp] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [testOtpMsg, setTestOtpMsg] = useState("");

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [appliedCouponType, setAppliedCouponType] = useState(""); // "FIRST50" or "SATYAM"
  const [couponErrorMsg, setCouponErrorMsg] = useState("");

  const handleApplyCoupon = () => {
    if (!couponCode) {
      setCouponErrorMsg("Please enter a coupon code.");
      return;
    }

    const code = couponCode.toUpperCase();

    if (code === "FIRST50") {
      if (myOrders && myOrders.length > 0) {
        setCouponErrorMsg("FIRST50 is only valid for your first order.");
        setIsCouponApplied(false);
        setAppliedCouponType("");
      } else {
        setCouponErrorMsg("");
        setIsCouponApplied(true);
        setAppliedCouponType("FIRST50");
      }
    } else if (code === "SATYAM") {
      setCouponErrorMsg("");
      setIsCouponApplied(true);
      setAppliedCouponType("SATYAM");
    } else {
      setCouponErrorMsg("Invalid coupon code.");
      setIsCouponApplied(false);
      setAppliedCouponType("");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setIsCouponApplied(false);
    setAppliedCouponType("");
    setCouponErrorMsg("");
  };

  // Base charges
  let finalDeliveryFee = dynamicDeliveryFee;
  let finalHandlingCharge = itemTotal > 0 ? 15 : 0;
  let finalGst = itemTotal > 0 ? Math.round(itemTotal * 0.05) : 0;
  let discountAmount = 0;

  // Apply Coupon Logic
  if (isCouponApplied) {
    if (appliedCouponType === "FIRST50") {
      discountAmount = Math.round(itemTotal * 0.5);
    } else if (appliedCouponType === "SATYAM") {
      discountAmount = Math.round(itemTotal * 0.7);
      finalDeliveryFee = 0; // Waive delivery
      finalHandlingCharge = 0; // Waive handling
      finalGst = 0; // Waive GST
    }
  }

  const AmountWithDeliveryFee = itemTotal - discountAmount + finalDeliveryFee + finalHandlingCharge + finalGst;

  // Export these finals so the JSX and payload use them
  const deliveryFee = finalDeliveryFee;
  const handlingCharge = finalHandlingCharge;
  const gst = finalGst;

  // Automatically fetch current location on mount if not available in Redux
  useEffect(() => {
    if (location?.lat && location?.lon) {
      setCurrentLat(location.lat);
      setCurrentLon(location.lon);
    } else {
      getCurrentLocation();
    }
  }, [location]);

  const onDragEnd = (e) => {
    const { lat, lng } = e.target._latlng
    dispatch(setLocation({ lat, lon: lng }))
    setCurrentLat(lat);
    setCurrentLon(lng);
    getAddressByLatLng(lat, lng)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        dispatch(setLocation({ lat: latitude, lon: longitude }));
        getAddressByLatLng(latitude, longitude);
      }, (error) => console.log(error), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else if (userData?.location?.coordinates) {
      const latitude = userData.location.coordinates[1]
      const longitude = userData.location.coordinates[0]
      dispatch(setLocation({ lat: latitude, lon: longitude }))
      getAddressByLatLng(latitude, longitude)
    }
  }

  const getAddressByLatLng = async (lat, lng) => {
    try {
      const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`)
      if (result?.data?.results?.length > 0) {
        const formatted = result.data.results[0].formatted
        dispatch(setAddress(formatted))
        setAddressInput(formatted)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getLatLngByAddress = async () => {
    if (!addressInput) return;
    try {
      const result = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apiKey}`)
      if (result.data.features.length > 0) {
        const { lat, lon } = result.data.features[0].properties
        dispatch(setLocation({ lat, lon }))
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleInitiatePayment = () => {
    if (!addressInput) {
      alert("Please enter a delivery address first!");
      return;
    }

    if (!selectedMethod) {
      alert("Please select a payment method to proceed.");
      return;
    }

    // Generate DigiEats-style Payment OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedOtp(generatedOtp);
    setTestOtpMsg(`(Simulated SMS sent: ${generatedOtp})`);
    setPaymentOtp("");
    setOtpError("");
    setShowOtpModal(true);
  }

  const handleVerifyPaymentOtp = () => {
    if (paymentOtp !== expectedOtp) {
      setOtpError("Invalid OTP. Please try again.");
      return;
    }

    // OTP Verified - Proceed to actual placement
    setShowOtpModal(false);
    handlePlaceOrder();
  }

  const handlePlaceOrder = async () => {
    setLoading(true);

    // Logic: If user picked COD, send "cod". 
    // If they picked UPI, Card, or Netbanking, we send "online" to backend to trigger Razorpay.
    const actualPaymentMethod = selectedMethod === "cod" ? "cod" : "online";

    try {
      const result = await axios.post(`${serverUrl}/api/order/place-order`, {
        paymentMethod: actualPaymentMethod,
        deliveryAddress: {
          text: addressInput,
          latitude: currentLat,
          longitude: currentLon
        },
        itemTotal,
        handlingCharge,
        gst,
        deliveryFee,
        discountAmount, // added discountAmount to payload
        totalAmount: AmountWithDeliveryFee,
        cartItems
      }, { withCredentials: true })

      if (actualPaymentMethod === "cod") {
        dispatch(addMyOrder(result.data))
        dispatch(clearCart())
        navigate("/order-placed")
      } else {
        // ONLINE PAYMENT LOGIC
        const { orderId, razorOrder } = result.data;

        // If backend returned a mock order id (because secret is missing), simulate success
        if (razorOrder && razorOrder.id === 'mock_order_id') {
          try {
            const verifyResult = await axios.post(`${serverUrl}/api/order/verify-payment`, {
              razorpay_payment_id: "mock_payment_" + Date.now(),
              razorpay_order_id: razorOrder.id,
              razorpay_signature: "mock_signature",
              orderId
            }, { withCredentials: true });
            dispatch(addMyOrder(verifyResult.data));
            dispatch(clearCart());
            navigate("/order-placed");
          } catch (err) {
            console.log(err);
            alert("Dummy Payment Verification Failed");
            setLoading(false);
          }
          return;
        }

        // Safety Check: Is Razorpay script loaded?
        if (!window.Razorpay) {
          alert("Razorpay SDK failed to load. Please check your internet connection.");
          setLoading(false);
          return;
        }

        openRazorpayWindow(orderId, razorOrder)
      }

    } catch (error) {
      console.log("Order Error:", error)
      // THIS WILL SHOW THE REAL ERROR FROM BACKEND
      alert(error.response?.data?.message || "Order Failed. Please check console for details.");
      setLoading(false);
    }
  }

  const openRazorpayWindow = (orderId, razorOrder) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorOrder.amount,
      currency: 'INR',
      name: "DigiEats",
      description: "Food Delivery Payment",
      handler: async function (response) {

        try {
          const result = await axios.post(`${serverUrl}/api/order/verify-payment`, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId
          }, { withCredentials: true })
          dispatch(addMyOrder(result.data))
          dispatch(clearCart())
          navigate("/order-placed")
        } catch (error) {
          console.log(error)
          alert("Payment Verification Failed");
        }
      },
      prefill: {
        name: userData?.name || "",
        email: userData?.email || "",
        contact: ""
      },
      theme: {
        color: "#e23744"
      }
    }

    if (razorOrder.id && razorOrder.id !== 'mock_order_id') {
      options.order_id = razorOrder.id;
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  useEffect(() => {
    if (address) {
      setAddressInput(address)
    }
  }, [address])

  // Helper to render payment options vertically
  const PaymentOption = ({ id, icon, title, subtitle }) => (
    <div
      onClick={() => setSelectedMethod(id)}
      className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedMethod === id
        ? "border-[#e23744] bg-red-50 shadow-sm ring-1 ring-[#e23744]"
        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 ${selectedMethod === id ? "border-[#e23744]" : "border-gray-400"
        }`}>
        {selectedMethod === id && <div className="w-2.5 h-2.5 rounded-full bg-[#e23744]" />}
      </div>

      <div className="mr-4">
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6 mt-10'>
      <div className='absolute top-[20px] left-[20px] z-[10] cursor-pointer' onClick={() => navigate("/")}>
        <IoIosArrowRoundBack size={35} className='text-[#e23744]' />
      </div>

      <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>
        <h1 className='text-3xl font-bold text-gray-800 border-b pb-4'>Checkout</h1>

        {/* Location Section */}
        <section>
          <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'><IoLocationSharp className='text-[#e23744]' /> Delivery Location</h2>
          <div className='flex gap-2 mb-3'>
            <input
              type="text"
              className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]'
              placeholder='Enter Your Delivery Address..'
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
            />
            <button className='bg-[#e23744] hover:bg-[#cb202d] text-white px-3 py-2 rounded-lg flex items-center justify-center' onClick={getLatLngByAddress}>
              <IoSearchOutline size={17} />
            </button>
            <button className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center' onClick={getCurrentLocation}>
              <TbCurrentLocation size={17} />
            </button>
          </div>
          <div className='rounded-xl border overflow-hidden h-48'>
            <MapContainer className={"w-full h-full"} center={[currentLat, currentLon]} zoom={16}>
              <TileLayer attribution='&copy; Google Maps' url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
              <RecenterMap location={{ lat: currentLat, lon: currentLon }} />
              <Marker position={[currentLat, currentLon]} draggable eventHandlers={{ dragend: onDragEnd }} />
            </MapContainer>
          </div>
        </section>

        {/* PAYMENT METHOD SECTION - Vertical List */}
        <section>
          <h2 className='text-lg font-semibold mb-3 text-gray-800'>Select Payment Method</h2>

          <div className='flex flex-col gap-3'>

            <PaymentOption
              id="upi"
              icon={
                <div className="flex gap-2">
                  <FaGooglePay size={24} className="text-gray-600" />
                  <SiPhonepe size={20} className="text-purple-600" />
                  <SiPaytm size={20} className="text-blue-500" />
                </div>
              }
              title="UPI Apps"
              subtitle="Google Pay, PhonePe, Paytm"
            />

            <PaymentOption
              id="card"
              icon={
                <div className="flex gap-2">
                  <RiVisaLine size={24} className="text-blue-700" />
                  <FaCreditCard size={20} className="text-gray-600" />
                </div>
              }
              title="Credit / Debit Card"
              subtitle="Visa, Mastercard, RuPay"
            />

            <PaymentOption
              id="netbanking"
              icon={<FaUniversity size={20} className="text-gray-600" />}
              title="Net Banking"
              subtitle="All Indian banks supported"
            />

            <PaymentOption
              id="cod"
              icon={<MdDeliveryDining size={24} className="text-green-600" />}
              title="Cash on Delivery"
              subtitle="Pay cash at your doorstep"
            />

          </div>
        </section>

        {/* Coupon Section */}
        <section>
          <div className='rounded-xl border border-gray-200 bg-white p-5 mt-2 space-y-3'>
            <h2 className='text-lg font-semibold text-gray-800 border-b pb-2'>Apply Coupon</h2>
            <div className='flex items-center gap-2'>
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={isCouponApplied}
                className={`flex-1 p-3 border rounded-lg outline-none uppercase transition-all ${isCouponApplied ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 focus:border-[#e23744]'}`}
              />
              {isCouponApplied ? (
                <button
                  onClick={handleRemoveCoupon}
                  className='bg-red-50 text-red-600 font-bold px-4 py-3 rounded-lg hover:bg-red-100 transition-colors'
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={handleApplyCoupon}
                  className='bg-gray-900 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all'
                >
                  Apply
                </button>
              )}
            </div>
            {couponErrorMsg && <p className='text-red-500 text-sm mt-1'>{couponErrorMsg}</p>}
            {isCouponApplied && appliedCouponType === "FIRST50" && <p className='text-green-600 text-sm font-medium mt-1'>Got 50% off on Item Total! 🎉</p>}
            {isCouponApplied && appliedCouponType === "SATYAM" && <p className='text-green-600 text-sm font-medium mt-1'>Flat 70% Off + Zero Delivery/Taxes! 🚀</p>}
          </div>
        </section>

        {/* Order Summary */}
        <section>
          <div className='rounded-xl border border-gray-200 bg-white p-5 space-y-3'>
            <h2 className='text-lg font-semibold text-gray-800 border-b pb-2'>Bill Details</h2>
            {cartItems.map((item, index) => (
              <div key={index} className='flex justify-between text-sm text-gray-600'>
                <span className='flex items-center gap-2'>
                  <span className='w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-xs font-bold'>{item.quantity}</span>
                  x {item.name}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className='border-t border-dashed border-gray-300 my-2'></div>
            <div className='flex justify-between text-gray-700 font-medium'>
              <span>Item Total</span>
              <span>₹{itemTotal}</span>
            </div>
            <div className='flex justify-between text-gray-700'>
              <span>Handling & Platform Fee</span>
              <span>₹{handlingCharge}</span>
            </div>
            <div className='flex justify-between text-gray-700'>
              <span>GST & Restaurant Charges</span>
              <span>₹{gst}</span>
            </div>
            <div className='flex justify-between text-gray-700'>
              <span>Delivery Fee</span>
              <span className='text-green-600 font-bold'>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
            </div>
            {isCouponApplied && (
              <div className='flex justify-between text-green-600 font-medium'>
                <span>Coupon Discount ({appliedCouponType})</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className='border-t border-gray-300 pt-3 flex justify-between text-xl font-bold text-gray-900'>
              <span>To Pay</span>
              <span>₹{AmountWithDeliveryFee}</span>
            </div>
          </div>
        </section>

        {/* Place Order Button */}
        <button
          className='w-full bg-gradient-to-r from-[#e23744] to-[#ff5252] hover:shadow-2xl text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-lg'
          onClick={handleInitiatePayment}
          disabled={loading}
        >
          {loading ? "Processing..." : (
            !selectedMethod ? "Select Payment Method" :
              selectedMethod === "cod" ? `Place Order (COD)` : `Pay ₹${AmountWithDeliveryFee}`
          )}
        </button>

      </div>

      {/* DigiEats-Style Payment OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Payment</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the 4-digit OTP sent to your registered mobile number to confirm this order.</p>

            <div className="mb-6">
              <input
                type="text"
                className="w-full border-2 rounded-xl px-4 py-3 text-center tracking-[1em] text-2xl font-bold focus:outline-none transition-colors"
                style={{ borderColor: paymentOtp.length === 4 ? primaryColor : "#e5e7eb" }}
                maxLength={4}
                onChange={(e) => setPaymentOtp(e.target.value.replace(/\D/g, ''))}
                value={paymentOtp}
                placeholder="○ ○ ○ ○"
              />
            </div>

            {testOtpMsg && (
              <p className="mb-6 text-xs text-center font-bold text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                {testOtpMsg}
              </p>
            )}

            {otpError && <p className="text-red-500 text-sm mb-4 text-center font-medium">*{otpError}</p>}

            <button
              className="w-full py-3 rounded-xl text-white font-bold transition-colors mb-3"
              style={{ backgroundColor: paymentOtp.length === 4 ? primaryColor : "#f3a5aa" }}
              onClick={handleVerifyPaymentOtp}
              disabled={paymentOtp.length !== 4}
            >
              Verify OTP & Pay
            </button>
            <button
              className="w-full py-3 rounded-xl text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setShowOtpModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default CheckOut