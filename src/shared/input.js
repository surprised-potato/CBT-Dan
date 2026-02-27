export const renderInput = ({ id, type = 'text', label, placeholder = '', value = '', required = false, classes = '', showToggle = false }) => {
    const isPassword = type === 'password';

    return `
        <div class="flex flex-col gap-2 mb-6">
            ${label ? `<label for="${id}" class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-2">${label}</label>` : ''}
            <div class="relative w-full">
                <input 
                    id="${id}" 
                    type="${type}" 
                    placeholder="${placeholder}" 
                    value="${value}"
                    ${required ? 'required' : ''}
                    class="w-full p-5 ${showToggle && isPassword ? 'pr-14' : ''} text-[14px] font-bold text-gray-900 border border-gray-200 rounded-2xl focus:border-blue-500/50 focus:outline-none transition-all bg-gray-50 shadow-inner focus:bg-white focus:shadow-xl focus:shadow-blue-50/50 placeholder:text-gray-500 ${classes}"
                >
                ${showToggle && isPassword ? `
                    <button type="button" data-toggle-for="${id}" class="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1 transition-colors focus:outline-none">
                        <svg class="w-5 h-5 eye-on" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        <svg class="w-5 h-5 eye-off hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
};
