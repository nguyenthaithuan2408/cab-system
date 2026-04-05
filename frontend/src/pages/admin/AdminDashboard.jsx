import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();

    // Dữ liệu giả lập cho Bảng chuyến đi gần đây
    const recentRides = [
        { id: '#RC-1029', user: 'Nguyễn Văn A', driver: 'Lê Văn Tùng', route: 'ĐH Công Nghiệp -> Sân bay', price: '42.000đ', status: 'Hoàn thành' },
        { id: '#RC-1030', user: 'Trần Thị B', driver: 'Đang tìm...', route: 'Landmark 81 -> Q1', price: '55.000đ', status: 'Đang tìm xe' },
        { id: '#RC-1031', user: 'Lê Hoàng C', driver: 'Phạm Văn D', route: 'Bến xe MĐ -> Gò Vấp', price: '120.000đ', status: 'Đang di chuyển' },
        { id: '#RC-1032', user: 'Phạm Phú E', driver: 'Võ Thị F', route: 'QTSC -> Q7', price: '85.000đ', status: 'Đã hủy' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">

            {/* 1. SIDEBAR (Thanh menu bên trái) */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                {/* Logo */}
                <div className="h-20 flex items-center px-6 border-b border-gray-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="font-bold text-sm">SC</span>
                    </div>
                    <span className="text-xl font-bold tracking-wide">Smart Cab</span>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="space-y-2">
                        <div onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20 cursor-pointer">
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
                        <div onClick={() => navigate('/admin/map')} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                            <span className="font-medium">Bản đồ Real-time</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT (Khu vực nội dung chính) */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 z-10">
                    <h2 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <input type="text" placeholder="Tìm kiếm mã chuyến..." className="bg-gray-100 text-sm rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
                            <svg className="w-4 h-4 text-gray-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <div className="flex items-center gap-3 border-l pl-6">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">Admin Manager</p>
                                <p className="text-xs text-gray-500">admin@smartcab.vn</p>
                            </div>
                            <img src="https://i.pravatar.cc/150?img=11" alt="Admin" className="w-10 h-10 rounded-full border-2 border-blue-100" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-8">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Doanh thu hôm nay</p>
                                    <h3 className="text-2xl font-black text-gray-900">12.5M VNĐ</h3>
                                </div>
                                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                            </div>
                            <p className="text-sm text-green-600 font-medium mt-4 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                +15% so với hôm qua
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Cuốc xe đang chạy</p>
                                    <h3 className="text-2xl font-black text-gray-900">42</h3>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                            </div>
                            <p className="text-sm text-blue-600 font-medium mt-4 flex items-center gap-1">Trực tiếp (Real-time)</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Tài xế Online</p>
                                    <h3 className="text-2xl font-black text-gray-900">128</h3>
                                </div>
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mt-4">Trên tổng số 850 đối tác</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Khách hàng mới</p>
                                    <h3 className="text-2xl font-black text-gray-900">+35</h3>
                                </div>
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mt-4">Đăng ký trong 24h qua</p>
                        </div>
                    </div>

                    {/* Recent Rides Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Chuyến đi gần đây</h3>
                            <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800">Xem tất cả</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="bg-gray-50/50 text-xs uppercase text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Mã chuyến</th>
                                        <th className="px-6 py-4">Khách hàng</th>
                                        <th className="px-6 py-4">Tài xế</th>
                                        <th className="px-6 py-4">Lộ trình</th>
                                        <th className="px-6 py-4">Cước phí</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentRides.map((ride, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{ride.id}</td>
                                            <td className="px-6 py-4">{ride.user}</td>
                                            <td className="px-6 py-4">{ride.driver}</td>
                                            <td className="px-6 py-4 truncate max-w-xs">{ride.route}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{ride.price}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ride.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                                                    ride.status === 'Đang tìm xe' ? 'bg-orange-100 text-orange-700' :
                                                        ride.status === 'Đang di chuyển' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {ride.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}