import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RideCompleted() {
    const navigate = useNavigate();

    return (
        <div className="h-full bg-green-50 flex flex-col items-center justify-center p-6 text-center">

            {/* Hiệu ứng checkmark thành công */}
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/40 animate-[bounce_1s_ease-in-out_1]">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-2">Hoàn thành!</h1>
            <p className="text-gray-500 font-medium mb-10">Bạn đã đưa khách đến nơi an toàn</p>

            {/* Bill tóm tắt */}
            <div className="w-full bg-white p-8 rounded-[2rem] shadow-xl mb-auto">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Thu nhập chuyến này</p>
                <h2 className="text-5xl font-black text-green-600 mb-6">35.000đ</h2>

                <div className="h-px w-full bg-gray-100 border-dashed border-t-2 mb-6"></div>

                <div className="flex justify-between items-center mb-4 text-gray-600 font-medium">
                    <span>Tổng cước (Khách trả)</span>
                    <span className="text-gray-900">42.000đ</span>
                </div>
                <div className="flex justify-between items-center mb-6 text-gray-600 font-medium">
                    <span>Chiết khấu (15%)</span>
                    <span className="text-red-500">-7.000đ</span>
                </div>

                {/* Cảnh báo thu tiền mặt */}
                <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl flex items-center gap-3 text-left">
                    <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                        <p className="font-bold text-sm">Thu tiền mặt</p>
                        <p className="text-xs">Vui lòng thu đúng 42.000đ từ khách</p>
                    </div>
                </div>
            </div>

            {/* Điều hướng */}
            <div className="w-full gap-3 flex flex-col">
                <button
                    onClick={() => navigate('/driver/earnings')}
                    className="w-full bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl hover:bg-blue-100 transition-colors"
                >
                    Xem báo cáo thu nhập
                </button>
                <button
                    onClick={() => navigate('/driver/home')}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors text-lg"
                >
                    Tiếp tục nhận cuốc
                </button>
            </div>

        </div>
    );
}