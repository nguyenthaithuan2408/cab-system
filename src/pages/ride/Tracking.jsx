import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverInfoCard from '../../components/DriverInfoCard';

export default function Tracking() {
    const navigate = useNavigate();
    const [eta, setEta] = useState(5);

    // Dữ liệu tài xế giả lập
    const mockDriver = {
        name: "Lê Văn Tùng",
        rating: 4.9,
        carModel: "VinFast VF8 - Trắng",
        plate: "51K-123.45",
        avatar: "https://i.pravatar.cc/150?u=tung"
    };

    useEffect(() => {
        // Mô phỏng ETA giảm dần theo thời gian
        const interval = setInterval(() => {
            setEta((prev) => (prev > 1 ? prev - 1 : 1));
        }, 10000); // 10 giây giảm 1 phút

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-full w-full bg-blue-50 overflow-hidden">

            {/* 1. Bản đồ tràn viền (Hiển thị tài xế đang đến) */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=10.8231,106.6297&zoom=15&size=600x800&path=color:0x2563eb|weight:5|10.8280,106.6250|10.8231,106.6297&markers=icon:https://tinyurl.com/2p8x8m4a|10.8280,106.6250&markers=color:blue|label:P|10.8231,106.6297&maptype=roadmap&sensor=false')" }}
            ></div>

            {/* Thông báo trạng thái phía trên */}
            <div className="absolute top-10 left-0 right-0 px-6 z-10">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 text-center">
                    <p className="text-gray-500 text-sm font-medium">Tài xế đang đến điểm đón</p>
                    <h2 className="text-2xl font-black text-blue-600">{eta} phút nữa</h2>
                </div>
            </div>

            {/* 2. Driver Info Card (Nằm nổi ở dưới) */}
            <div className="absolute bottom-10 left-0 right-0 px-4 z-20">
                <DriverInfoCard driver={mockDriver} />

                {/* Nút hoàn thành chuyến đi giả lập (để demo tiếp luồng) */}
                <button
                    onClick={() => navigate('/payment')}
                    className="w-full mt-4 py-2 text-gray-400 text-xs font-medium uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                    [ Demo: Kết thúc chuyến đi ]
                </button>
            </div>

            {/* Nút hỗ trợ khẩn cấp (SOS) */}
            <button className="absolute top-32 right-4 bg-red-100 p-3 rounded-full shadow-lg z-10 text-red-600 border border-red-200">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
            </button>

        </div>
    );
}