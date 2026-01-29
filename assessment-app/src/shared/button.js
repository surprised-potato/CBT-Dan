export const renderButton = ({ text, id = '', type = 'button', variant = 'primary', classes = '' }) => {
    const baseStyle = "w-full min-h-[44px] px-4 py-3 rounded-lg font-semibold transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

    const variants = {
        primary: "bg-blue-600 text-white shadow-md hover:bg-blue-700",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        danger: "bg-red-500 text-white hover:bg-red-600",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-50"
    };

    const variantStyle = variants[variant] || variants.primary;

    return `
        <button id="${id}" type="${type}" class="${baseStyle} ${variantStyle} ${classes}">
            ${text}
        </button>
    `;
};
