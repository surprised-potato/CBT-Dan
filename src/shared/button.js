export const renderButton = ({ text, id = '', type = 'button', variant = 'primary', classes = '' }) => {
    const baseStyle = "w-full min-h-[56px] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl mb-2";

    const variants = {
        primary: "bg-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] border border-white/20",
        secondary: "bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white shadow-lg backdrop-blur-md",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white shadow-xl shadow-red-900/10",
        ghost: "bg-transparent text-white/40 hover:bg-white/5 uppercase tracking-[0.3em] text-[10px] font-black"
    };

    const variantStyle = variants[variant] || variants.primary;

    return `
        <button id="${id}" type="${type}" class="${baseStyle} ${variantStyle} ${classes}">
            ${text}
        </button>
    `;
};
