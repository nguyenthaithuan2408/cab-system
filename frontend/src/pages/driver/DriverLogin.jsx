import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DriverLogin() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');

    return (
        <div className="h-full bg-gray-900 text-white flex flex-col p-6">

            {/* Header */}
            <div className="mt-12 mb-8">
                {/* ...Bằng cục này */}
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM7.5 16c-.83 0-1.5-.67-1.5-1.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-2">
                    {step === 1 && 'Đối tác Tài xế'}
                    {step === 2 && 'Nhập mã xác nhận'}
                    {step === 3 && 'Xác minh KYC'}
                </h1>
                <p className="text-gray-400">
                    {step === 1 && 'Nhập số điện thoại đăng ký'}
                    {step === 2 && `Mã 4 số đã gửi đến ${phone}`}
                    {step === 3 && 'Chụp ảnh Bằng lái xe để nhận cuốc'}
                </p>
            </div>

            {/* Form Area */}
            <div className="flex-1 flex flex-col">
                {step === 1 && (
                    <div className="flex flex-col flex-1">
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="09xx xxx xxx"
                            className="w-full bg-gray-800 text-white px-4 py-5 rounded-2xl border border-gray-700 focus:border-blue-500 outline-none text-xl tracking-widest font-semibold transition-all mb-4"
                        />
                        <button
                            onClick={() => phone.length > 8 && setStep(2)}
                            className="mt-auto mb-4 w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-700 transition-all text-xl"
                        >
                            Tiếp tục
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col flex-1">
                        <div className="flex justify-between mb-8 gap-3">
                            {[1, 2, 3, 4].map((digit) => (
                                <input
                                    key={digit}
                                    type="text"
                                    maxLength={1}
                                    className="w-full h-16 bg-gray-800 text-center text-3xl font-bold rounded-2xl border border-gray-700 focus:border-blue-500 outline-none"
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(3)}
                            className="mt-auto mb-4 w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-700 transition-all text-xl"
                        >
                            Xác nhận OTP
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col flex-1">
                        <div className="flex-1 bg-gray-800 border-2 border-dashed border-gray-600 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-700 transition-colors mb-8">
                            <div className="bg-gray-700 p-4 rounded-full text-blue-400">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                            <span className="text-gray-300 font-semibold text-lg">Chạm để quét Bằng Lái Xe</span>
                        </div>

                        <button
                            onClick={() => navigate('/driver/home')}
                            className="mt-auto mb-4 w-full bg-green-500 text-gray-900 font-black py-5 rounded-2xl shadow-lg hover:bg-green-400 transition-all text-xl uppercase tracking-wider"
                        >
                            Hoàn tất & Trực tuyến
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}