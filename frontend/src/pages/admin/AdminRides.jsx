import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminRides() {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('All');

    // Dữ liệu giả lập danh sách chuyến đi chi tiết
    const allRides = [
        { id: 'RC-9901', time: '14:20 04/04', customer: 'Nguyễn Văn A', driver: 'Lê Văn Tùng', type: 'SmartBike', price: '42.000đ', status: 'Completed' },
        { id: 'RC-9902', time: '14:15 04/04', customer: 'Trần Thị B', driver: 'Phạm Văn D', type: 'SmartCar', price: '125.000đ', status: 'Ongoing' },
        { id: 'RC-9903', time: '13:45 04/04', customer: 'Lê Hoàng C', driver: 'Võ Thị F', type: 'SmartSUV', price: '85.000đ', status: 'Cancelled' },
        { id: 'RC-9904', time: '13:00 04/04', customer: 'Phạm Phú E', driver: 'Đang tìm...', type: 'SmartBike', price: '15.000đ', status: 'Searching' },
        { id: 'RC-9905', time: '12:30 04/04', customer: 'Hoàng Anh G', driver: 'Trần Văn H', type: 'SmartCar', price: '65.000đ', status: 'Completed' },
    ];

    // Lọc dữ liệu theo trạng thái được chọn
    const filteredRides = filterStatus === 'All'
        ? allRides
        : allRides.filter(ride => ride.status === filterStatus);

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-900">

            {/* 1. SIDEBAR (Đồng nhất với Dashboard) */}
            <div className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
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
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20 cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                            <span className="font-medium">Quản lý chuyến đi</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 shrink-0">
                    <h2 className="text-2xl font-bold">Lịch sử Chuyến đi</h2>
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm font-bold text-blue-600">
                            Tổng cộng: {allRides.length} chuyến
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">

                    {/* Filters & Search */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                            {['All', 'Completed', 'Ongoing', 'Cancelled', 'Searching'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === status ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {status === 'All' ? 'Tất cả' :
                                        status === 'Completed' ? 'Hoàn thành' :
                                            status === 'Ongoing' ? 'Đang đi' :
                                                status === 'Cancelled' ? 'Đã hủy' : 'Đang tìm'}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input type="date" className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            <button className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black transition-all">Xuất báo cáo (Excel)</button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-5">Mã chuyến</th>
                                    <th className="px-6 py-5">Thời gian</th>
                                    <th className="px-6 py-5">Khách hàng</th>
                                    <th className="px-6 py-5">Tài xế</th>
                                    <th className="px-6 py-5">Loại xe</th>
                                    <th className="px-6 py-5">Giá cước</th>
                                    <th className="px-6 py-5">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRides.map((ride) => (
                                    <tr key={ride.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-5 font-bold text-blue-600 cursor-pointer hover:underline">{ride.id}</td>
                                        <td className="px-6 py-5 text-gray-500">{ride.time}</td>
                                        <td className="px-6 py-5 font-bold text-gray-900">{ride.customer}</td>
                                        <td className="px-6 py-5 font-medium text-gray-700">{ride.driver}</td>
                                        <td className="px-6 py-5">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-black uppercase text-gray-500">{ride.type}</span>
                                        </td>
                                        <td className="px-6 py-5 font-black text-gray-900">{ride.price}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${ride.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    ride.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                                                        ride.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-orange-100 text-orange-700 animate-pulse'
                                                }`}>
                                                {ride.status === 'Completed' ? 'Hoàn thành' :
                                                    ride.status === 'Ongoing' ? 'Đang đi' :
                                                        ride.status === 'Cancelled' ? 'Đã hủy' : 'Đang tìm'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredRides.length === 0 && (
                            <div className="p-20 text-center text-gray-400 font-medium italic">
                                Không tìm thấy chuyến đi nào trong mục này.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}