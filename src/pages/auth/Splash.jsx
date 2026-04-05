import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    // Dữ liệu 3 slide giới thiệu (Book - Track - Pay)
    const slides = [
        { title: "Book a Ride", desc: "Tìm xe nhanh chóng quanh khu vực của bạn." },
        { title: "Track Real-time", desc: "Theo dõi vị trí tài xế chính xác trên bản đồ." },
        { title: "Pay Seamlessly", desc: "Thanh toán dễ dàng qua thẻ, ví hoặc tiền mặt." }
    ];

    return (
        <div className="flex flex-col h-screen bg-white justify-between pb-8">

            {/* Khung Logo Trung Tâm */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    {/* Biểu tượng ô tô to cho màn hình Splash */}
                    <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/50 mx-auto">
                        <svg className="w-20 h-20 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM7.5 16c-.83 0-1.5-.67-1.5-1.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Smart Cab</h1>
                </div>
            </div>

            {/* Carousel Giới thiệu */}
            <div className="px-6 mb-10 text-center h-24">
                <h2 className="text-xl font-semibold text-gray-900">{slides[currentSlide].title}</h2>
                <p className="text-gray-500 mt-2 text-sm">{slides[currentSlide].desc}</p>

                {/* Dấu chấm chuyển slide */}
                <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Component: Primary Button (CTA) */}
            <div className="px-6 flex gap-4">
                <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                    className="w-1/3 py-3 rounded-xl font-semibold text-blue-600 bg-blue-50 border border-blue-100"
                >
                    Next
                </button>
                <button
                    // Chuyển hướng sang trang Login theo luồng Customer Journey
                    onClick={() => navigate('/login')}
                    className="w-2/3 py-3 rounded-xl font-semibold text-white bg-blue-600 shadow-md hover:bg-blue-700"
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}