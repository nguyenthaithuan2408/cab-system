import React from 'react';

export default function RideOptionCard({ id, name, icon, capacity, eta, price, isSelected, onSelect }) {
    return (
        <div
            onClick={() => onSelect(id)}
            className={`flex-shrink-0 w-36 p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center justify-between gap-2 ${isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
        >
            {/* Icon xe (Dùng Emoji tạm cho nhẹ, sau này thay bằng SVG) */}
            <div className="text-5xl mt-2 drop-shadow-md">{icon}</div>

            <div className="text-center mt-2 w-full">
                <h3 className="font-bold text-gray-900 text-sm flex items-center justify-center gap-1">
                    {name}
                    <span className="text-xs text-gray-500 font-normal">
                        <svg className="w-3 h-3 inline-block" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                        {capacity}
                    </span>
                </h3>
                <p className="text-xs text-green-600 font-medium">{eta} phút nữa tới</p>
            </div>

            <div className="w-full h-px bg-gray-200 my-1"></div>

            <div className="text-lg font-bold text-gray-900">{price}</div>
        </div>
    );
}