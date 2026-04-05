import React from 'react';

export default function BottomSheet({ children }) {
    return (
        // Khối div này sẽ nổi lên trên cùng (z-20) và bám chặt vào đáy màn hình (bottom-0)
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-20">
            {/* Thanh gạt nhỏ ở trên cùng (Drag handle) */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>

            {/* Nội dung bên trong sẽ được truyền vào đây */}
            {children}
        </div>
    );
}