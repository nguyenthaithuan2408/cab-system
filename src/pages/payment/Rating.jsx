import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Rating() {
    const navigate = useNavigate();
    const [stars, setStars] = useState(5);

    return (
        <div className="h-full bg-white flex flex-col p-6 items-center text-center">
            <div className="flex-1 mt-12">
                {/* Avatar Tài xế (Dùng lại info từ C7) */}
                <div className="relative mb-6">
                    <img
                        src="https://i.pravatar.cc/150?u=tung"
                        alt="Driver"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 mx-auto"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                        Tài xế
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bạn thấy chuyến đi thế nào?</h2>
                <p className="text-gray-500 mb-8">Đánh giá của bạn giúp anh Lê Văn Tùng cải thiện dịch vụ tốt hơn</p>

                {/* Rating Stars Component */}
                <div className="flex justify-center gap-2 mb-10">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStars(s)}
                            className={`text-5xl transition-all ${s <= stars ? 'text-yellow-400 scale-110' : 'text-gray-200'}`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                {/* Text Area cho feedback */}
                <textarea
                    placeholder="Chia sẻ thêm cảm nhận của bạn (không bắt buộc)..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-700 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all h-32"
                ></textarea>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Tài xế thân thiện', 'Xe sạch sẽ', 'Lái xe an toàn'].map(tag => (
                        <span key={tag} className="px-4 py-2 bg-gray-100 rounded-full text-xs font-semibold text-gray-600 cursor-pointer hover:bg-blue-100 hover:text-blue-600 transition-colors">
                            + {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Submit Button & Finish Flow */}
            <button
                onClick={() => navigate('/home')} // Quay lại trang Home để bắt đầu hành trình mới
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-lg"
            >
                Gửi đánh giá
            </button>
        </div>
    );
}