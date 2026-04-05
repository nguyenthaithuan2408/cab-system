import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Earnings() {
    const navigate = useNavigate();

    // Dữ liệu giả lập lịch sử chuyến đi
    const trips = [
        { id: 1, time: '14:30', date: 'Hôm nay', route: 'ĐH Công nghiệp -> Sân bay', fare: '+35.000đ', status: 'Hoàn thành' },
        { id: 2, time: '10:15', date: 'Hôm nay', route: 'Bến xe Miền Đông -> Landmark 81', fare: '+52.000đ', status: 'Hoàn thành' },
        { id: 3, time: '08:00', date: 'Hôm nay', route: 'QTSC -> Vincom Gò Vấp', fare: '+40.000đ', status: 'Hoàn thành' },
    ];

    return (
        <div className="h-full bg-gray-50 flex flex-col">

            {/* Header Wallet */}
            <div className="bg-blue-600 px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-lg relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/driver/home')} className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h1 className="text-xl font-bold text-white">Thu nhập của tôi</h1>
                </div>

                <div className="text-center text-white">
                    <p className="text-blue-200 font-medium mb-1">Tổng doanh thu hôm nay</p>
                    <h2 className="text-5xl font-black mb-4">127.000đ</h2>
                    <div className="flex justify-center gap-4 text-sm">
                        <div className="bg-blue-700/50 px-4 py-2 rounded-xl">
                            <span className="block text-blue-200">Chuyến</span>
                            <span className="font-bold text-lg">3</span>
                        </div>
                        <div className="bg-blue-700/50 px-4 py-2 rounded-xl">
                            <span className="block text-blue-200">Online</span>
                            <span className="font-bold text-lg">4h 30m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg">Lịch sử chuyến đi</h3>
                    <span className="text-blue-600 text-sm font-bold cursor-pointer">Tuần này ▾</span>
                </div>

                <div className="flex flex-col gap-4">
                    {trips.map((trip) => (
                        <div key={trip.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{trip.route}</p>
                                    <p className="text-xs text-gray-500 mt-1">{trip.time} • {trip.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-green-600">{trip.fare}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rút tiền CTA */}
            <div className="p-6 bg-white border-t border-gray-100">
                <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-800 transition-colors text-lg flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    Rút tiền về thẻ
                </button>
            </div>

        </div>
    );
}