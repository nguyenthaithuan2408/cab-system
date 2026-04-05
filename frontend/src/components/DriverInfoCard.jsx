import React from 'react';

export default function DriverInfoCard({ driver }) {
    return (
        <div className="bg-white rounded-3xl shadow-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    {/* Avatar tài xế */}
                    <div className="relative">
                        <img
                            src={driver.avatar}
                            alt="Driver"
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{driver.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                            <span className="text-yellow-500">★</span> {driver.rating} • {driver.carModel}
                        </div>
                    </div>
                </div>

                {/* Biển số xe */}
                <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="font-bold text-gray-800 text-sm tracking-widest">{driver.plate}</span>
                </div>
            </div>

            {/* Các nút hành động (Call / Chat) */}
            <div className="flex gap-3">
                <button className="flex-1 bg-blue-50 text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    Nhắn tin
                </button>
                <button className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    Gọi điện
                </button>
            </div>
        </div>
    );
}