export const renderInput = ({ id, type = 'text', label, placeholder = '', value = '', required = false, classes = '', showToggle = false }) => {
    const isPassword = type === 'password';
    const hasDarkOverride = classes.includes('text-white');

    // Base: layout + sizing only. Color depends on context.
    const colorDefaults = hasDarkOverride
        ? '' // Dark pages pass their own bg/text/border via classes
        : 'text-slate-900 bg-white/40 focus:bg-white/80 border-white/20 placeholder:text-slate-400/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)]';

    const labelColor = hasDarkOverride ? 'text-white/40 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-400';

    return `
        <div class="flex flex-col gap-2 mb-6 group">
            ${label ? `<label for="${id}" class="text-[9px] font-black ${labelColor} uppercase tracking-[0.4em] px-4 transition-colors">${label}</label>` : ''}
            <div class="relative w-full">
                <input 
                    id="${id}" 
                    type="${type}" 
                    placeholder="${placeholder}" 
                    value="${value}"
                    ${required ? 'required' : ''}
                    class="w-full p-5 ${showToggle && isPassword ? 'pr-14' : ''} text-[15px] font-medium rounded-[28px] focus:outline-none transition-all backdrop-blur-md focus:border-blue-500/30 ${colorDefaults} ${classes}"
                >
                ${showToggle && isPassword ? `
                    <button type="button" data-toggle-for="${id}" class="absolute right-6 top-1/2 -translate-y-1/2 ${hasDarkOverride ? 'text-white/30 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'} p-1.5 transition-all focus:outline-none active:scale-90">
                        <svg class="w-5 h-5 eye-on" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        <svg class="w-5 h-5 eye-off hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
};
