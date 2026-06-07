import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosArrowRoundBack } from "react-icons/io";

function Info() {
  const { type } = useParams();
  const navigate = useNavigate();

  const content = {
    about: { title: "About DigiEats", text: "We are Mumbai's fastest food delivery service, bringing your favorite meals from local shops to your door." },
    terms: { title: "Terms of Service", text: "By using DigiEats, you agree to our delivery policies and community guidelines." },
    privacy: { title: "Privacy Policy", text: "Your data is secure with us. We never share your personal information with third parties." },
    contact: { title: "Contact Us", text: "Email: support@DigiEats.com | Phone: +91 98765 43210 | Address: Mumbai, India" }
  };

  const data = content[type] || content.about;

  return (
    <div className="min-h-screen bg-[#fff9f6] p-10 flex flex-col items-center">
       <div className='absolute top-[20px] left-[20px] cursor-pointer' onClick={() => navigate("/")}>
        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full mt-10">
        <h1 className="text-3xl font-bold text-[#ff4d2d] mb-4">{data.title}</h1>
        <p className="text-gray-700 leading-relaxed">{data.text}</p>
      </div>
    </div>
  );
}

export default Info;