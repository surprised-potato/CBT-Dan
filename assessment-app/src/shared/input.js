export const renderInput = ({ id, type = 'text', label, placeholder = '', value = '', required = false, classes = '' }) => {
    return `
        <div class="flex flex-col gap-2 mb-6">
            ${label ? `<label for="${id}" class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2">${label}</label>` : ''}
            <input 
                id="${id}" 
                type="${type}" 
                placeholder="${placeholder}" 
                value="${value}"
                ${required ? 'required' : ''}
                class="w-full p-5 text-[14px] font-bold text-gray-900 border border-gray-200 rounded-2xl focus:border-blue-500/50 focus:outline-none transition-all bg-gray-50 shadow-inner focus:bg-white focus:shadow-xl focus:shadow-blue-50/50 placeholder:text-gray-400 ${classes}"
            >
        </div>
    `;
};
