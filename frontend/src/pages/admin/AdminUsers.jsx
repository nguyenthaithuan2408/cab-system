import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
    const navigate = useNavigate();
    // State quản lý Tab đang mở ('customers' hoặc 'drivers')
    const [activeTab, setActiveTab] = useState('customers');

    // Dữ liệu giả lập Khách hàng
    const customers = [
        { id: 'KH-001', name: 'Nguyễn Văn A', phone: '0901234567', rides: 45, rating: 4.9, status: 'Hoạt động' },
        { id: 'KH-002', name: 'Trần Thị B', phone: '0912345678', rides: 12, rating: 4.5, status: 'Hoạt động' },
        { id: 'KH-003', name: 'Lê Hoàng C', phone: '0923456789', rides: 0, rating: 0, status: 'Bị khóa' },
    ];

    // Dữ liệu giả lập Tài xế
    const drivers = [
        { id: 'TX-101', name: 'Lê Văn Tùng', phone: '0987654321', vehicle: '51K-123.45', kyc: 'Đã xác minh', status: 'Online' },
        { id: 'TX-102', name: 'Phạm Văn D', phone: '0976543210', vehicle: '59P-987.65', kyc: 'Chờ duyệt', status: 'Offline' },
        { id: 'TX-103', name: 'Võ Thị F', phone: '0965432109', vehicle: '60A-111.22', kyc: 'Đã xác minh', status: 'Bị khóa' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">

            {/* 1. SIDEBAR (Giữ nguyên cấu trúc) */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="h-20 flex items-center px-6 border-b border-gray-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="font-bold text-sm">SC</span>
                    </div>
                    <span className="text-xl font-bold tracking-wide">Smart Cab</span>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="space-y-2">
                        <div onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            <span className="font-medium">Tổng quan (KPI)</span>
                        </div>
                        {/* Nút Tab này đang được Active màu xanh */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20 cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            <span className="font-medium">Người dùng & Tài xế</span>
                        </div>
                        {/* Các nút khác giữ nguyên */}
                        <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                            <span className="font-medium">Quản lý chuyến đi</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 z-10">
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h2>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 border-l pl-6">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">Admin Manager</p>
                            </div>
                            <img src="https://i.pravatar.cc/150?img=11" alt="Admin" className="w-10 h-10 rounded-full border-2 border-blue-100" />
                        </div>
                    </div>
                </header>

                {/* Bảng Dữ Liệu */}
                <main className="flex-1 overflow-y-auto p-8">

                    {/* Tabs Switcher */}
                    <div className="flex gap-4 mb-8 border-b border-gray-200 pb-4">
                        <button
                            onClick={() => setActiveTab('customers')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                        >
                            Khách hàng (Customers)
                        </button>
                        <button
                            onClick={() => setActiveTab('drivers')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'drivers' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                        >
                            Đối tác Tài xế (Drivers)
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">
                                {activeTab === 'customers' ? 'Danh sách Khách hàng' : 'Danh sách Tài xế'}
                            </h3>
                            <input type="text" placeholder="Tìm kiếm SĐT/Tên..." className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="bg-gray-50/50 text-xs uppercase text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Mã số</th>
                                        <th className="px-6 py-4">Họ và Tên</th>
                                        <th className="px-6 py-4">Số điện thoại</th>
                                        {activeTab === 'customers' ? (
                                            <>
                                                <th className="px-6 py-4">Số chuyến</th>
                                                <th className="px-6 py-4">Đánh giá</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4">Biển số xe</th>
                                                <th className="px-6 py-4">Tình trạng KYC</th>
                                            </>
                                        )}
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(activeTab === 'customers' ? customers : drivers).map((user, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{user.id}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                                            <td className="px-6 py-4">{user.phone}</td>

                                            {activeTab === 'customers' ? (
                                                <>
                                                    <td className="px-6 py-4">{user.rides}</td>
                                                    <td className="px-6 py-4 text-yellow-500 font-bold">★ {user.rating}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-gray-700">{user.vehicle}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.kyc === 'Đã xác minh' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {user.kyc}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'Hoạt động' || user.status === 'Online' ? 'bg-blue-100 text-blue-700' :
                                                        user.status === 'Bị khóa' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="text-blue-600 hover:text-blue-900 font-medium mr-3">Sửa</button>
                                                <button className="text-red-600 hover:text-red-900 font-medium">Khóa</button>
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