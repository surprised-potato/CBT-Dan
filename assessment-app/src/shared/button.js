export const renderButton = ({ text, id = '', type = 'button', variant = 'primary', classes = '' }) => {
    const baseStyle = "w-full min-h-[56px] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl mb-2";

    const variants = {
        primary: "bg-blue-premium text-white shadow-blue-200/50 hover:shadow-blue-300/50 hover:-translate-y-0.5",
        secondary: "bg-white text-gray-500 border border-gray-100 shadow-blue-50/50 hover:shadow-blue-100/50 hover:bg-gray-50",
        danger: "bg-red-50 text-red-600 border border-red-100 shadow-red-50/50 hover:bg-red-500 hover:text-white",
        ghost: "bg-transparent text-gray-500 hover:bg-gray-50 uppercase tracking-widest text-[10px] font-black"
    };

    const variantStyle = variants[variant] || variants.primary;

    return `
        <button id="${id}" type="${type}" class="${baseStyle} ${variantStyle} ${classes}">
            ${text}
        </button>
    `;
};
