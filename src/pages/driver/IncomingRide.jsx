import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IncomingRide() {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(15); // 15 giây để quyết định

    useEffect(() => {
        if (timeLeft === 0) {
            navigate('/driver/home'); // Hết giờ thì quay về màn hình chờ
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, navigate]);

    return (
        <div className="relative h-full w-full bg-gray-900 overflow-hidden flex flex-col">

            {/* 1. Bản đồ hiển thị lộ trình đón khách (Full-screen Map) */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-60"
                style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=14&size=600x800&path=color:0xff0000|weight:5|10.8231,106.6297|10.8150,106.6350&markers=color:blue|label:D|10.8231,106.6297&markers=color:green|label:K|10.8150,106.6350&maptype=roadmap&sensor=false')" }}
            ></div>

            {/* Hiệu ứng nhấp nháy đỏ khi có cuốc mới (Urgency) */}
            <div className="absolute inset-0 border-[12px] border-blue-500/30 animate-pulse pointer-events-none z-10"></div>

            {/* 2. Header: Thu nhập dự kiến */}
            <div className="relative z-20 mt-12 px-6 text-center">
                <div className="bg-blue-600 inline-block px-8 py-3 rounded-2xl shadow-2xl shadow-blue-500/40">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Cước phí ước tính</p>
                    <h2 className="text-3xl font-black text-white">42.000đ</h2>
                </div>
            </div>

            {/* 3. Thông tin khách hàng & Điểm đón */}
            <div className="relative z-20 mt-auto px-4 pb-6">
                <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl">
                    {/* Thông tin khách */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                                <img src="https://i.pravatar.cc/150?u=customer" alt="Customer" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Nguyễn Văn A</h3>
                                <p className="text-xs text-gray-500">★ 4.9 (500+ chuyến)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-600 font-black text-xl">1.2 km</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Cách đây</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full mb-6"></div>

                    {/* Lộ trình */}
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex items-start gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <p className="text-sm font-medium text-gray-700 truncate">12 Nguyễn Văn Bảo, Gò Vấp (IUH)</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            <p className="text-sm font-medium text-gray-700 truncate">Sân bay Tân Sơn Nhất, Tân Bình</p>
                        </div>
                    </div>

                    {/* 4. Bộ đôi nút bấm CTA Lớn (Accept / Reject) */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/driver/home')}
                            className="flex-1 bg-gray-100 text-gray-500 font-bold py-5 rounded-2xl active:scale-95 transition-all"
                        >
                            Từ chối
                        </button>
                        <button
                            onClick={() => navigate('/driver/active')}
                            className="flex-[2] bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all text-xl flex items-center justify-center gap-3"
                        >
                            CHẤP NHẬN
                            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">{timeLeft}s</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}