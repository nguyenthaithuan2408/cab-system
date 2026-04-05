import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Payment() {
    const navigate = useNavigate();
    const [method, setMethod] = useState('cash');

    const paymentMethods = [
        { id: 'cash', name: 'Tiền mặt', icon: '💵' },
        { id: 'card', name: 'Thẻ Visa/Mastercard', icon: '💳' },
        { id: 'wallet', name: 'Ví Smart Wallet', icon: '👛' },
    ];

    return (
        <div className="h-full bg-white flex flex-col p-6">
            <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-2">Thanh toán</h1>
                <p className="text-gray-500 mb-8">Chuyến đi đã hoàn thành an toàn</p>

                {/* Fare Summary (Tóm tắt hóa đơn) */}
                <div className="bg-blue-600 rounded-3xl p-8 text-white mb-8 shadow-xl shadow-blue-100">
                    <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-widest">Tổng cước phí</p>
                    <h2 className="text-4xl font-black">42.000đ</h2>
                    <div className="mt-6 pt-4 border-t border-white/20 flex justify-between text-sm">
                        <span>Quãng đường (3.2km)</span>
                        <span>35.000đ</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                        <span>Phí dịch vụ</span>
                        <span>7.000đ</span>
                    </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-4">Phương thức thanh toán</h3>
                <div className="flex flex-col gap-3">
                    {paymentMethods.map((m) => (
                        <div
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${method === m.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{m.icon}</span>
                                <span className="font-semibold text-gray-800">{m.name}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === m.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                }`}>
                                {method === m.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pay Button */}
            <button
                onClick={() => navigate('/rating')}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-lg"
            >
                Xác nhận thanh toán
            </button>
        </div>
    );
}