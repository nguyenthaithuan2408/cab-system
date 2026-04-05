import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ActiveRide() {
    const navigate = useNavigate();
    // State quản lý 2 giai đoạn: 'picking_up' (Đang đi đón) -> 'driving' (Đang chở khách)
    const [rideState, setRideState] = useState('picking_up');

    // Hàm xử lý khi bấm nút CTA chính
    const handleMainAction = () => {
        if (rideState === 'picking_up') {
            // Khi đã tới điểm đón khách
            setRideState('driving');
        } else {
            // Khi đã tới đích đến -> Chuyển sang màn hình Kết thúc (C6)
            navigate('/driver/completed');
        }
    };

    return (
        <div className="relative h-full w-full bg-blue-50 overflow-hidden flex flex-col">

            {/* 1. Bản đồ lộ trình (thay đổi linh hoạt theo trạng thái) */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: rideState === 'picking_up'
                        ? "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=15&size=600x800&path=color:0x2563eb|weight:5|10.8280,106.6250|10.8231,106.6297&markers=color:blue|label:D|10.8280,106.6250&markers=color:green|label:K|10.8231,106.6297&maptype=roadmap&sensor=false')"
                        : "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8100,106.6400&zoom=14&size=600x800&path=color:0x2563eb|weight:5|10.8231,106.6297|10.7931,106.6597&markers=color:green|label:K|10.8231,106.6297&markers=color:red|label:B|10.7931,106.6597&maptype=roadmap&sensor=false')"
                }}
            ></div>

            {/* 2. Voice Navigation Bar (Thanh điều hướng giọng nói) */}
            <div className="relative z-10 bg-green-600 text-white p-4 shadow-xl flex items-center gap-4 rounded-b-3xl">
                <div className="bg-green-700 p-3 rounded-full animate-bounce">
                    {/* Icon rẽ phải */}
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
                <div className="flex-1">
                    <p className="text-3xl font-black">200m</p>
                    <p className="text-green-100 font-medium text-lg">
                        {rideState === 'picking_up' ? 'Rẽ phải vào Nguyễn Văn Bảo' : 'Đi thẳng Phạm Văn Đồng'}
                    </p>
                </div>
                <div className="bg-green-700/50 p-2 rounded-full">
                    {/* Icon Loa phát âm thanh */}
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                </div>
            </div>

            {/* Nút SOS nằm nổi */}
            <button className="absolute top-32 right-4 bg-red-600 p-4 rounded-full shadow-lg shadow-red-500/40 z-10 text-white border-2 border-white">
                <span className="font-bold">SOS</span>
            </button>

            {/* 3. Bottom Sheet: Thông tin khách & Nút hành động */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-20 overflow-hidden">
                {/* Progress Bar ở mép trên */}
                <div className="h-1.5 w-full bg-gray-100">
                    <div className={`h-full bg-blue-600 transition-all duration-1000 ${rideState === 'picking_up' ? 'w-1/3' : 'w-3/4'}`}></div>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">
                                {rideState === 'picking_up' ? '5 phút' : '15 phút'}
                            </h2>
                            <p className="text-gray-500 font-medium">
                                {rideState === 'picking_up' ? '1.2 km • Đang đón khách' : '6.5 km • Đang chở khách'}
                            </p>
                        </div>

                        {/* Nếu đang đi đón khách mới hiện nút Gọi/Chat */}
                        {rideState === 'picking_up' && (
                            <div className="flex gap-2">
                                <button className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                </button>
                                <button className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 mb-6">
                        <img src="https://i.pravatar.cc/150?u=customer" alt="Customer" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                        <div>
                            <h3 className="font-bold text-gray-900">Nguyễn Văn A</h3>
                            <p className="text-sm text-gray-500">
                                {rideState === 'picking_up' ? 'Điểm đón: 12 Nguyễn Văn Bảo' : 'Điểm đến: Landmark 81'}
                            </p>
                        </div>
                    </div>

                    {/* Nút CTA lớn (Thay đổi theo trạng thái) */}
                    <button
                        onClick={handleMainAction}
                        className={`w-full font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all text-xl uppercase tracking-wider ${rideState === 'picking_up'
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                : 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'
                            }`}
                    >
                        {rideState === 'picking_up' ? 'Đã đến điểm đón' : 'Hoàn thành chuyến đi'}
                    </button>
                </div>
            </div>

        </div>
    );
}