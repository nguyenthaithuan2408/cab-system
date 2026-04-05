import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../../components/BottomSheet';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="relative h-full w-full bg-blue-50 overflow-hidden">

            {/* 1. MOCK MAP (Bản đồ giả lập tràn viền) */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=14&size=600x800&maptype=roadmap&sensor=false')" }}
            ></div>

            {/* Nút Menu góc trái (Nổi trên bản đồ) */}
            <button className="absolute top-6 left-4 bg-white p-3 rounded-full shadow-lg z-10 text-gray-700 hover:bg-gray-50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>

            {/* 2. PICKUP PIN (Ghim định vị ở chính giữa màn hình) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pb-12">
                <div className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full mb-2 shadow-lg animate-bounce">
                    Đón tại đây
                </div>
                {/* Biểu tượng Pin */}
                <svg className="w-12 h-12 text-blue-600 drop-shadow-xl" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
            </div>

            {/* 3. BOTTOM SHEET (Bảng thông tin trượt dưới đáy) */}
            <BottomSheet>
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Bạn muốn đi đâu?</h2>

                {/* Nút tìm kiếm điểm đến -> Bấm vào sẽ sang trang C4 (Destination) */}
                <div
                    onClick={() => navigate('/destination')}
                    className="bg-gray-100 p-4 rounded-2xl flex items-center gap-4 mb-6 cursor-pointer hover:bg-gray-200 transition-colors shadow-inner"
                >
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <span className="text-gray-500 font-medium text-lg">Tìm điểm đến...</span>
                </div>

                {/* Shortcuts: Nhà & Công ty */}
                <div className="flex gap-4">
                    <button className="flex-1 bg-blue-50 py-4 rounded-2xl flex items-center justify-center gap-2 text-blue-700 font-semibold border border-blue-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                        Nhà
                    </button>
                    <button className="flex-1 bg-blue-50 py-4 rounded-2xl flex items-center justify-center gap-2 text-blue-700 font-semibold border border-blue-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        Công ty
                    </button>
                </div>
            </BottomSheet>

        </div>
    );
}