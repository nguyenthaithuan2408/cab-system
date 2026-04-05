import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
    const navigate = useNavigate();
    // Điền sẵn tài khoản để lúc demo không mất công gõ
    const [email, setEmail] = useState('admin@smartcab.vn');
    const [password, setPassword] = useState('admin123');

    const handleLogin = (e) => {
        e.preventDefault();
        // Giả lập gọi API Auth Service thành công -> Chuyển vào Dashboard
        navigate('/admin/dashboard');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-blue-900 relative overflow-hidden p-4">

            {/* Lớp nền ảnh mờ chuyên nghiệp phủ toàn màn hình */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>

            {/* Thẻ form nổi căn giữa màn hình */}
            <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 relative z-10">

                {/* Đoạn code MỚI (Icon Ô tô) */}
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/50 mx-auto sm:mx-0">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM7.5 16c-.83 0-1.5-.67-1.5-1.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                    </svg>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">Đăng nhập Admin</h2>
                <p className="text-gray-500 mb-10 text-center sm:text-left">Vui lòng nhập tài khoản quản trị viên để tiếp tục.</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tên đăng nhập / Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-700">Mật khẩu</label>
                            <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700">Quên mật khẩu?</a>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-gray-900/20 hover:bg-black active:scale-95 transition-all mt-4 text-lg"
                    >
                        Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
}