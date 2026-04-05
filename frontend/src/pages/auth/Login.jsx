import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    // State để chuyển đổi giữa màn hình nhập SĐT và màn hình nhập OTP
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');

    // Xử lý khi bấm nút "Tiếp tục" ở bước nhập SĐT
    const handleRequestOTP = (e) => {
        e.preventDefault();
        if (phone.length > 8) {
            setStep(2); // Chuyển sang màn hình OTP
        }
    };

    // Xử lý khi bấm "Xác nhận" OTP
    const handleVerifyOTP = (e) => {
        e.preventDefault();
        // Sau này sẽ gọi API Auth Service ở đây. Tạm thời cho qua trang Home
        navigate('/home');
    };

    return (
        <div className="min-h-screen bg-white p-6 flex flex-col">

            {/* Tiêu đề linh hoạt theo Step */}
            <div className="mt-12 mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {step === 1 ? 'Xin chào,' : 'Xác thực OTP'}
                </h1>
                <p className="text-gray-500">
                    {step === 1
                        ? 'Nhập số điện thoại để bắt đầu hành trình'
                        : `Mã 6 số đã được gửi đến SĐT ${phone}`}
                </p>
            </div>

            {/* Form xử lý */}
            {step === 1 ? (
                <form onSubmit={handleRequestOTP} className="flex flex-col flex-1">
                    {/* Component: InputField */}
                    <div className="mb-6">
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Nhập số điện thoại (VD: 0912...)"
                            className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-lg"
                        />
                    </div>

                    {/* Social Login (Optional theo sườn của thầy) */}
                    <div className="text-center mt-4 mb-8">
                        <p className="text-sm text-gray-500 mb-4">Hoặc đăng nhập bằng</p>
                        <div className="flex gap-4 justify-center">
                            <button type="button" className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                                {/* Icon Google mượn tạm từ Wikimedia */}
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />
                            </button>
                            <button type="button" className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                                {/* Icon Facebook */}
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Component: SubmitButton */}
                    <button
                        type="submit"
                        className="w-full mt-auto mb-4 bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-lg"
                    >
                        Tiếp tục
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="flex flex-col flex-1">
                    {/* Component: OTPInput */}
                    <div className="flex justify-between mb-8 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength={1}
                                className="w-12 h-14 text-center text-2xl font-semibold rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        ))}
                    </div>

                    <p className="text-center text-sm text-gray-500 mb-8">
                        Chưa nhận được mã? <span className="text-blue-600 font-semibold cursor-pointer">Gửi lại</span>
                    </p>

                    {/* Nút Xác nhận và Nút Quay lại */}
                    <div className="mt-auto mb-4 flex flex-col gap-3">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-lg"
                        >
                            Xác nhận
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)} // Quay lại bước 1
                            className="w-full bg-gray-50 text-gray-600 font-semibold py-4 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}