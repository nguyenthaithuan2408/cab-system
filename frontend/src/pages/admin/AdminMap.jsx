import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminMap() {
    const navigate = useNavigate();

    // Dữ liệu giả lập vị trí các xe trên bản đồ (Tọa độ % theo màn hình)
    const activeDrivers = [
        { id: 1, top: '40%', left: '30%', status: 'available' }, // Đang rảnh (Màu xanh)
        { id: 2, top: '60%', left: '50%', status: 'busy' },      // Đang chở khách (Màu xanh dương)
        { id: 3, top: '30%', left: '70%', status: 'busy' },
        { id: 4, top: '75%', left: '40%', status: 'available' },
        { id: 5, top: '55%', left: '80%', status: 'available' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-900">

            {/* 1. SIDEBAR */}
            <div className="w-64 bg-gray-900 text-white flex flex-col shrink-0 z-20">
                <div className="h-20 flex items-center px-6 border-b border-gray-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="font-bold text-sm text-white">SC</span>
                    </div>
                    <span className="text-xl font-bold tracking-wide">Smart Cab</span>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="space-y-2">
                        <div onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            <span className="font-medium">Tổng quan (KPI)</span>
                        </div>
                        <div onClick={() => navigate('/admin/users')} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            <span className="font-medium">Người dùng & Tài xế</span>
                        </div>
                        <div onClick={() => navigate('/admin/rides')} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                            <span className="font-medium">Quản lý chuyến đi</span>
                        </div>
                        {/* Active Tab */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20 cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                            <span className="font-medium">Bản đồ Real-time</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BẢN ĐỒ TOÀN MÀN HÌNH (Map Area) */}
            <div className="flex-1 relative overflow-hidden bg-gray-200">

                {/* Nền bản đồ mô phỏng Google Maps/Mapbox */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=13&size=1920x1080&maptype=roadmap&style=feature:all|element:labels|visibility:off&sensor=false')" }}
                ></div>

                {/* Lớp phủ mờ để các Marker nổi bật hơn */}
                <div className="absolute inset-0 bg-blue-900/10 z-0"></div>

                {/* CÁC ĐIỂM NÓNG (Heatmap / Surge Pricing Zones) */}
                <div className="absolute top-[45%] left-[45%] w-64 h-64 bg-red-500 rounded-full blur-[80px] opacity-30 z-0 animate-pulse"></div>
                <div className="absolute top-[20%] left-[60%] w-48 h-48 bg-orange-500 rounded-full blur-[60px] opacity-20 z-0 animate-pulse"></div>

                {/* CÁC MỤC TIÊU (Drivers on Map) */}
                {activeDrivers.map((driver) => (
                    <div
                        key={driver.id}
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ top: driver.top, left: driver.left }}
                    >
                        {/* Hiệu ứng gợn sóng Radar */}
                        <div className={`absolute -inset-4 rounded-full opacity-50 animate-ping ${driver.status === 'available' ? 'bg-green-400' : 'bg-blue-400'
                            }`}></div>
                        {/* Chấm Marker */}
                        <div className={`relative w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] ${driver.status === 'available' ? 'bg-green-500' : 'bg-blue-600'
                            }`}></div>
                    </div>
                ))}

                {/* 3. BẢNG ĐIỀU KHIỂN NỔI (Floating Controls) */}
                {/* Header nổi */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white pointer-events-auto">
                        <h2 className="text-xl font-black text-gray-900 mb-1">Giám sát Khu vực TP.HCM</h2>
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Cập nhật trực tiếp (Live)
                        </p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white pointer-events-auto flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg></button>
                    </div>
                </div>

                {/* Widget Thống kê góc dưới */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white p-6 w-80 z-20">
                    <h3 className="font-bold text-gray-800 mb-4">Trạng thái hạm đội</h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                <span className="text-sm font-medium text-gray-600">Xe đang rảnh (Sẵn sàng)</span>
                            </div>
                            <span className="font-black text-gray-900">86</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                                <span className="text-sm font-medium text-gray-600">Đang chở khách</span>
                            </div>
                            <span className="font-black text-gray-900">42</span>
                        </div>

                        <div className="h-px bg-gray-200 my-2"></div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-sm font-bold text-red-600">Khu vực quá tải (Surge)</span>
                            </div>
                            <span className="font-bold text-red-600">2.5x</span>
                        </div>
                    </div>

                    <button className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors text-sm">
                        Điều phối tự động
                    </button>
                </div>

            </div>
        </div>
    );
}