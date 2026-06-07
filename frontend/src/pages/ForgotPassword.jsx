import axios from 'axios';
import React, { useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { ClipLoader } from 'react-spinners';
import toast from 'react-hot-toast';

function ForgotPassword() {
  const primaryColor = "#ff4d2d";
  const hoverColor = "#e64323";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/send-otp`, { email }, { withCredentials: true })
      toast.success(result.data.message || "OTP sent successfully!");
      setStep(2)
      setLoading(false)
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send OTP")
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    setLoading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp }, { withCredentials: true })
      toast.success(result.data.message || "OTP verified!");
      setStep(3)
      setLoading(false)
    } catch (error) {
      toast.error(error?.response?.data?.message || "Invalid OTP")
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setLoading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword }, { withCredentials: true })
      toast.success(result.data.message || "Password reset successful!");
      setLoading(false)
      navigate("/signin")
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reset password")
      setLoading(false)
    }
  }

  return (
    <div className='flex w-full items-center justify-center min-h-screen p-4' style={{ backgroundColor: bgColor }}>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px]' style={{ border: `1px solid ${borderColor}` }}>
        <div className='flex items-center gap-4 mb-8'>
          <button
            onClick={() => navigate("/signin")}
            className="p-2 rounded-full hover:bg-red-50 transition-colors group cursor-pointer"
          >
            <IoIosArrowRoundBack size={26} className='text-[#ff4d2d] group-hover:-translate-x-1 transition-transform' />
          </button>
          <div>
            <h1 className='text-3xl font-bold' style={{ color: primaryColor }}>Forgot Password</h1>
            <p className='text-gray-500 text-sm mt-1'>
              {step === 1 && "We'll send a code to your email."}
              {step === 2 && "Enter the 4-digit code sent to you."}
              {step === 3 && "Create a strong new password."}
            </p>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <div className='mb-6'>
              <label htmlFor="email" className='block text-gray-700 font-medium mb-1'>Registered Email</label>
              <input
                type="email"
                id="email"
                className='w-full border rounded-lg px-4 py-3 focus:outline-none transition-shadow focus:ring-2 focus:ring-red-100'
                placeholder='Enter your email address'
                style={{ border: `1px solid ${borderColor}` }}
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
            <button
              className={`w-full font-bold py-3 text-lg rounded-xl transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer shadow-md active:scale-[0.98]`}
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color='white' /> : "Send Code"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className='mb-6'>
              <label htmlFor="otp" className='block text-gray-700 font-medium mb-1'>Verification Code</label>
              <input
                type="text"
                id="otp"
                className='w-full border rounded-lg px-4 py-3 text-center tracking-[0.3em] text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-red-100'
                placeholder='----'
                style={{ border: `1px solid ${borderColor}` }}
                maxLength={4}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                value={otp}
                required
              />
              <p className="text-sm text-gray-400 mt-2 text-center text-wrap">Code sent to <b>{email}</b></p>
            </div>
            <button
              className={`w-full font-bold py-3 text-lg rounded-xl transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer shadow-md active:scale-[0.98]`}
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 4}
            >
              {loading ? <ClipLoader size={20} color='white' /> : "Verify Code"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className='mb-4'>
              <label htmlFor="newPassword" className='block text-gray-700 font-medium mb-1'>New Password</label>
              <input
                type="password"
                id="newPassword"
                className='w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-100'
                placeholder='Enter minimum 6 characters'
                style={{ border: `1px solid ${borderColor}` }}
                onChange={(e) => setNewPassword(e.target.value)}
                value={newPassword}
                required
              />
            </div>
            <div className='mb-8'>
              <label htmlFor="ConfirmPassword" className='block text-gray-700 font-medium mb-1'>Confirm Password</label>
              <input
                type="password"
                id="ConfirmPassword"
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500 focus:ring-red-100' : 'focus:ring-red-100'}`}
                placeholder='Re-enter your new password'
                style={{ border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? '#ef4444' : borderColor}` }}
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1 font-medium">Passwords do not match</p>
              )}
            </div>
            <button
              className={`w-full font-bold py-3 text-lg rounded-xl transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer shadow-md active:scale-[0.98]`}
              onClick={handleResetPassword}
              disabled={loading || !newPassword || newPassword !== confirmPassword}
            >
              {loading ? <ClipLoader size={20} color='white' /> : "Reset & Login"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
