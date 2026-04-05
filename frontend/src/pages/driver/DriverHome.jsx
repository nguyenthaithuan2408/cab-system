import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DriverHome() {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        let timer;
        if (isOnline) {
            // MÔ PHỎNG HỆ THỐNG: Khi tài xế bật Online, sau 5 giây sẽ có cuốc xe tự động nổ
            timer = setTimeout(() => {
                navigate('/driver/incoming');
            }, 5000);
        }
        // Dọn dẹp bộ đếm nếu tài xế tắt Offline trước 5 giây
        return () => clearTimeout(timer);
    }, [isOnline, navigate]);

    return (
        <div className="relative h-full w-full bg-gray-100 overflow-hidden">

            {/* 1. Bản đồ nền (Map full-screen) */}
            <div
                className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${isOnline ? 'opacity-100' : 'opacity-50 grayscale'}`}
                style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=14&size=600x800&maptype=roadmap&sensor=false')" }}
            ></div>

            {/* Hiệu ứng mờ khi Offline để tập trung vào nút bấm */}
            {!isOnline && (
                <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm z-0"></div>
            )}

            {/* 2. Header & Real-time income widget (Thu nhập hôm nay) */}
            <div className="absolute top-8 left-4 right-4 z-10 flex justify-between items-start">
                <button className="bg-white p-3 rounded-full shadow-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    {/* Icon menu */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>

                {/* Widget Thu Nhập (Tích hợp viền xanh lá thể hiện sự tích cực) */}
                <div className="bg-white px-6 py-2 rounded-full shadow-lg flex flex-col items-center border-t-4 border-green-500">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Hôm nay</span>
                    <span className="text-xl font-black text-gray-900">450.000đ</span>
                </div>
            </div>

            {/* 3. Text trạng thái nổi giữa màn hình */}
            <div className="absolute top-32 left-0 right-0 flex justify-center z-10 transition-all">
                {isOnline ? (
                    <div className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-green-500/50 animate-pulse flex items-center gap-2">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                        ĐANG TÌM KHÁCH...
                    </div>
                ) : (
                    <div className="bg-gray-800 text-white px-6 py-2 rounded-full font-bold shadow-lg">
                        ĐANG NGOẠI TUYẾN
                    </div>
                )}
            </div>

            {/* 4. Nút GO / OFF khổng lồ ở dưới cùng */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
                <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`w-32 h-32 rounded-full border-8 shadow-2xl flex items-center justify-center text-4xl font-black transition-all duration-300 transform active:scale-90 ${isOnline
                            ? 'bg-red-500 border-red-200 text-white hover:bg-red-600 shadow-red-500/40'
                            : 'bg-blue-600 border-blue-200 text-white hover:bg-blue-700 shadow-blue-500/40'
                        }`}
                >
                    {isOnline ? 'OFF' : 'GO'}
                </button>
            </div>

        </div>
    );
}