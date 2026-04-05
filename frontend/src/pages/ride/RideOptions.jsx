import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RideOptionCard from '../../components/RideOptionCard';
import BottomSheet from '../../components/BottomSheet';

export default function RideOptions() {
    const navigate = useNavigate();
    // Mặc định chọn xe máy (id: 1)
    const [selectedRide, setSelectedRide] = useState(1);

    // Dữ liệu giả lập các loại xe (Pricing & ETA Service)
    const rides = [
        { id: 1, name: 'SmartBike', icon: '🛵', capacity: 1, eta: 3, price: '15.000đ' },
        { id: 2, name: 'SmartCar', icon: '🚗', capacity: 4, eta: 5, price: '42.000đ' },
        { id: 3, name: 'SmartSUV', icon: '🚙', capacity: 7, eta: 8, price: '55.000đ' },
    ];

    return (
        <div className="relative h-full w-full bg-blue-50 overflow-hidden flex flex-col">

            {/* 1. Bản đồ nửa trên có vẽ tuyến đường (Giả lập) */}
            <div className="flex-1 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=14&size=600x400&path=color:0x0000ff|weight:5|10.8231,106.6297|10.7931,106.6597&markers=color:blue|label:A|10.8231,106.6297&markers=color:red|label:B|10.7931,106.6597&maptype=roadmap&sensor=false')" }}
                ></div>

                {/* Nút Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-4 bg-white p-3 rounded-full shadow-lg z-10 text-gray-700 hover:bg-gray-50"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                </button>
            </div>

            {/* 2. Bảng chọn xe ở dưới (Dùng lại BottomSheet) */}
            <BottomSheet>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Chọn phương tiện</h2>

                    {/* Surge Indicator (Chỉ báo giá tăng) */}
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        Nhu cầu cao
                    </div>
                </div>

                {/* Danh sách thẻ vuốt ngang (Horizontal Scroll) */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {rides.map((ride) => (
                        <RideOptionCard
                            key={ride.id}
                            {...ride}
                            isSelected={selectedRide === ride.id}
                            onSelect={setSelectedRide}
                        />
                    ))}
                </div>

                {/* Khu vực Thanh toán & Nút Đặt xe */}
                <div className="mt-2 border-t border-gray-100 pt-4">
                    <div
                        onClick={() => navigate('/payment')} // Chạm vào để đổi phương thức thanh toán
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-xl mb-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <span className="font-semibold text-gray-800 text-sm">Tiền mặt</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>

                    <button
                        onClick={() => navigate('/searching')}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-lg animate-pulse"
                    >
                        Đặt {rides.find(r => r.id === selectedRide)?.name}
                    </button>
                </div>
            </BottomSheet>

        </div>
    );
}