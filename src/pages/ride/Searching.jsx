import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Searching() {
    const navigate = useNavigate();

    useEffect(() => {
        // MÔ PHỎNG WEBSOCKET (AI MATCHING): 
        // Hệ thống giả vờ mất 4 giây để tìm tài xế, sau đó tự động chuyển sang màn hình Theo dõi (C7)
        const timer = setTimeout(() => {
            navigate('/tracking');
        }, 4000);

        // Cleanup timer nếu người dùng bấm Hủy trước khi tìm thấy
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="relative h-full w-full bg-gray-900 overflow-hidden flex flex-col items-center justify-center">

            {/* 1. Bản đồ nền tối (Dark Map) để làm nổi bật hiệu ứng Radar */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
                style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=14&size=600x800&maptype=roadmap&sensor=false')" }}
            ></div>

            {/* 2. Hiệu ứng Radar (Animated Ripple bằng TailwindCSS) */}
            <div className="relative z-10 flex items-center justify-center mt-[-100px]">
                {/* Các vòng sóng tỏa ra */}
                <div className="absolute w-32 h-32 bg-blue-500 rounded-full opacity-75 animate-ping"></div>
                <div className="absolute w-48 h-48 bg-blue-400 rounded-full opacity-50 animate-ping" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute w-64 h-64 bg-blue-300 rounded-full opacity-25 animate-ping" style={{ animationDelay: '0.6s' }}></div>

                {/* Vòng tròn trung tâm cố định */}
                <div className="relative w-20 h-20 bg-blue-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.8)] flex items-center justify-center z-20">
                    <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>

            {/* 3. Text trạng thái */}
            <div className="relative z-10 mt-24 text-center">
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Đang tìm tài xế...</h2>
                <p className="text-blue-300 text-sm">Hệ thống đang kết nối với các xe gần bạn nhất</p>
            </div>

            {/* 4. Nút Hủy yêu cầu */}
            <div className="absolute bottom-10 left-0 right-0 px-6 z-10">
                <button
                    onClick={() => navigate(-1)} // Lệnh quay về màn hình Chọn xe nếu đổi ý
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold py-4 rounded-xl hover:bg-white/20 active:scale-95 transition-all text-lg"
                >
                    Hủy yêu cầu
                </button>
            </div>

        </div>
    );
}