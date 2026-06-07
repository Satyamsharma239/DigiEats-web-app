import React from 'react'
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-black text-white py-10 px-6 md:px-20 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-gray-700 pb-8">
        
        {/* Brand Name */}
        <div>
          <h1 className="text-3xl font-bold text-[#ff4d2d] mb-4 cursor-pointer" onClick={() => navigate("/")}>DigiEats</h1>
          <p className="text-gray-400 text-sm">
            Delicious food delivered to your doorstep. Fresh, fast, and reliable service.
          </p>
        </div>

        {/* Company Links - connected to your Info.jsx */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-[#ff4d2d]">Company</h2>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="hover:text-white cursor-pointer" onClick={() => navigate("/info/about")}>About Us</li>
            <li className="hover:text-white cursor-pointer" onClick={() => navigate("/info/terms")}>Terms of Service</li>
            <li className="hover:text-white cursor-pointer" onClick={() => navigate("/info/privacy")}>Privacy Policy</li>
          </ul>
        </div>

        {/* Support Links - connected to your Info.jsx & Orders */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-[#ff4d2d]">Support</h2>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="hover:text-white cursor-pointer" onClick={() => navigate("/info/contact")}>Contact Us</li>
            <li className="hover:text-white cursor-pointer" onClick={() => navigate("/my-orders")}>Help & Support</li>
          </ul>
        </div>

        {/* Social Icons */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-[#ff4d2d]">Follow Us</h2>
          <div className="flex gap-4">
            <FaFacebook size={24} className="hover:text-[#ff4d2d] cursor-pointer" />
            <FaInstagram size={24} className="hover:text-[#ff4d2d] cursor-pointer" />
            <FaTwitter size={24} className="hover:text-[#ff4d2d] cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm">
        © 2026 DigiEats. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer