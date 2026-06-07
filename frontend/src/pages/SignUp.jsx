import React from 'react'
import { useState } from 'react';
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import axios from "axios"
import { serverUrl } from '../App';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { ClipLoader } from "react-spinners"
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import toast from 'react-hot-toast';

function SignUp() {
    const primaryColor = "#ff4d2d";
    const hoverColor = "#e64323";
    const bgColor = "#fff9f6";
    const borderColor = "#ddd";
    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState("user")
    const navigate = useNavigate()
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [mobile, setMobile] = useState("")
    const [err, setErr] = useState("")
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()
    const [showOtpField, setShowOtpField] = useState(false)
    const [otp, setOtp] = useState("")
    const [sentOtpData, setSentOtpData] = useState(null)

    const handleSendOtp = async () => {
        if (!fullName || fullName.trim() === "") {
            return setErr("Full Name is required")
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return setErr("Please enter a valid email address (e.g. name@domain.com)")
        }

        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return setErr("Mobile number must be exactly 10 digits")
        }

        if (!password || password.length < 6) {
            return setErr("Password must be at least 6 characters long")
        }

        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/mobile/send-otp`, { mobile }, { withCredentials: true })
            setSentOtpData(result.data)
            setShowOtpField(true)
            setErr("")
            if (result.data.testOtp) {
                toast.success(`Verification OTP: ${result.data.testOtp}`, {
                    duration: 8000,
                    icon: '✉️',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            } else {
                toast.success("OTP sent to your mobile number");
            }
        } catch (error) {
            setErr(error?.response?.data?.message || "Failed to send OTP")
        }
        setLoading(false)
    }

    const handleVerifyAndSignUp = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return setErr("Please enter a valid email address (e.g. name@domain.com)")
        }

        if (!otp || otp.length < 4) {
            return setErr("Please enter the 6-digit OTP")
        }
        setLoading(true)
        try {
            // Check OTP
            await axios.post(`${serverUrl}/api/auth/mobile/verify-otp`, { mobile, otp }, { withCredentials: true })

            // If OTP succeeds, do the actual registration
            const result = await axios.post(`${serverUrl}/api/auth/signup`, {
                fullName, email, password, mobile, role
            }, { withCredentials: true })

            dispatch(setUserData(result.data))
            setErr("")
        } catch (error) {
            setErr(error?.response?.data?.message || "Invalid OTP or Registration failed")
        }
        setLoading(false)
    }

    const handleGoogleAuth = async () => {
        if (!mobile) {
            return setErr("mobile no is required")
        }
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        try {
            const { data } = await axios.post(`${serverUrl}/api/auth/google-auth`, {
                fullName: result.user.displayName,
                email: result.user.email,
                role,
                mobile
            }, { withCredentials: true })
            dispatch(setUserData(data))
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
            <div className={`bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px] `} style={{
                border: `1px solid ${borderColor}`
            }}>
                <h1 className={`text-3xl font-bold mb-2 `} style={{ color: primaryColor }}>DigiEats</h1>
                <p className='text-gray-600 mb-8'> Create your account to get started with delicious food deliveries
                </p>

                {/* fullName */}

                <div className='mb-4'>
                    <label htmlFor="fullName" className='block text-gray-700 font-medium mb-1'>Full Name</label>
                    <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none ' placeholder='Enter your Full Name' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        setFullName(val);
                    }} value={fullName} required />
                </div>
                {/* email */}

                <div className='mb-4'>
                    <label htmlFor="email" className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type="email" className='w-full border rounded-lg px-3 py-2 focus:outline-none ' placeholder='Enter your Email' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setEmail(e.target.value)} value={email} required />
                </div>
                {/* mobile*/}

                <div className='mb-4'>
                    <label htmlFor="mobile" className='block text-gray-700 font-medium mb-1'>Mobile</label>
                    <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none ' placeholder='Enter your 10-digit Mobile Number' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setMobile(val)
                    }} value={mobile} maxLength={10} required disabled={showOtpField} />
                </div>
                {/* password*/}

                <div className='mb-4'>
                    <label htmlFor="password" className='block text-gray-700 font-medium mb-1'>Password</label>
                    <div className='relative'>
                        <input type={`${showPassword ? "text" : "password"}`} className='w-full border rounded-lg px-3 py-2 focus:outline-none pr-10' placeholder='Enter your password' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setPassword(e.target.value)} value={password} required disabled={showOtpField} />

                        <button className='absolute right-3 cursor-pointer top-[14px] text-gray-500' onClick={() => setShowPassword(prev => !prev)} disabled={showOtpField}>{!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}</button>
                    </div>
                </div>
                {/* role*/}

                <div className='mb-4'>
                    <label htmlFor="role" className='block text-gray-700 font-medium mb-1'>Role</label>
                    <div className='flex gap-2'>
                        {["user", "owner", "deliveryBoy"].map((r) => (
                            <button key={r} disabled={showOtpField}
                                className={`flex-1 border rounded-lg px-3 py-2 text-center font-medium transition-colors ${!showOtpField ? 'cursor-pointer' : 'opacity-50'}`}
                                onClick={() => setRole(r)}
                                style={
                                    role == r ?
                                        { backgroundColor: primaryColor, color: "white" }
                                        : { border: `1px solid ${primaryColor}`, color: primaryColor }
                                }>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {showOtpField && (
                    <div className='mb-4 bg-orange-50 p-4 rounded-lg border border-orange-200'>
                        <label className='block text-gray-700 font-medium mb-1'>Enter OTP sent to {mobile}</label>
                        <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none tracking-[0.5em] text-center font-bold text-lg' placeholder='------' onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} value={otp} maxLength={6} />
                        {sentOtpData?.testOtp && <p className='text-xs text-green-600 mt-2 font-semibold'>Test OTP: {sentOtpData.testOtp}</p>}
                    </div>
                )}

                {!showOtpField ? (
                    <button className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSendOtp} disabled={loading || mobile.length < 10}>
                        {loading ? <ClipLoader size={20} color='white' /> : "Send OTP"}
                    </button>
                ) : (
                    <button className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleVerifyAndSignUp} disabled={loading || otp.length < 4}>
                        {loading ? <ClipLoader size={20} color='white' /> : "Verify & Sign Up"}
                    </button>
                )}

                {err && <p className='text-red-500 text-center text-sm font-semibold my-[10px]'>*{err}</p>}


                <button className='w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition cursor-pointer duration-200 border-gray-400 hover:bg-gray-100' onClick={handleGoogleAuth}>
                    <FcGoogle size={20} />
                    <span>Sign up with Google</span>
                </button>
                <p className='text-center mt-6 cursor-pointer' onClick={() => navigate("/signin")}>Already have an account ?  <span className='text-[#ff4d2d]'>Sign In</span></p>
            </div>
        </div>
    )
}

export default SignUp
