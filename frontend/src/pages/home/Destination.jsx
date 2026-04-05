import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Destination() {
    const navigate = useNavigate();
    const [destination, setDestination] = useState('');

    // Dữ liệu giả lập (Mock data) cho các địa điểm gần đây
    const recentPlaces = [
        { id: 1, name: 'Đại học Công nghiệp TP.HCM', address: '12 Nguyễn Văn Bảo, Phường 4, Gò Vấp' },
        { id: 2, name: 'Sân bay Tân Sơn Nhất', address: 'Đường Trường Sơn, Phường 2, Tân Bình' },
        { id: 3, name: 'Landmark 81', address: '720A Điện Biên Phủ, Phường 22, Bình Thạnh' },
    ];

    // Hàm xử lý khi chọn một địa điểm
    const handleSelectPlace = (place) => {
        // Sau này sẽ lưu điểm đến vào State, tạm thời chuyển luôn sang trang C5 (Chọn xe)
        navigate('/ride-options');
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col">

            {/* 1. Phần Header & Thanh tìm kiếm (Search Input) */}
            <div className="bg-white shadow-sm pt-8 pb-6 px-4 rounded-b-[2rem] z-10">

                {/* Tiêu đề & Nút quay lại */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)} // Lệnh quay lại trang trước đó
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Chọn điểm đến</h1>
                </div>

                {/* Form nhập liệu (Pick up & Drop off) */}
                <div className="relative flex flex-col gap-4 pl-2">
                    {/* Đường kẻ dọc nối 2 điểm visual */}
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-300 border-dashed border-l-2"></div>

                    {/* Ô Nhập Điểm Đón */}
                    <div className="relative flex items-center gap-4">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-100 z-10"></div>
                        <input
                            type="text"
                            readOnly
                            value="Vị trí hiện tại"
                            className="flex-1 bg-gray-100 px-4 py-3 rounded-xl text-gray-600 font-medium outline-none"
                        />
                    </div>

                    {/* Ô Nhập Điểm Đến */}
                    <div className="relative flex items-center gap-4">
                        <div className="w-3.5 h-3.5 bg-red-500 ring-4 ring-red-100 z-10"></div>
                        <input
                            type="text"
                            autoFocus // Tự động bật bàn phím khi vào trang này
                            placeholder="Bạn muốn đi đâu?"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="flex-1 bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white border border-transparent transition-all shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Danh sách địa điểm gần đây (Place List) */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Địa điểm gần đây</h2>

                <div className="flex flex-col gap-3">
                    {recentPlaces.map((place) => (
                        <div
                            key={place.id}
                            onClick={() => handleSelectPlace(place)}
                            className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all active:scale-95"
                        >
                            {/* Icon Đồng hồ (gần đây) */}
                            <div className="bg-gray-50 p-3 rounded-full text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-semibold text-gray-900 truncate text-base">{place.name}</h3>
                                <p className="text-sm text-gray-500 truncate">{place.address}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}