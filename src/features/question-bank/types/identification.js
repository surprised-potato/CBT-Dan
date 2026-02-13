export const renderIdentification = (question, index = 1) => {
    // Figure Rendering
    const figures = (question.figures || []).map(f => `
        <div class="relative group/fig rounded-4xl overflow-hidden border-8 border-white shadow-2xl mb-8">
            <img src="${f}" class="w-full h-auto object-cover transition-transform duration-700 group-hover/fig:scale-110">
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
    `).join('');

    return `
        <div class="space-y-8">
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-100">Direct Entry</span>
                </div>
                <div class="text-2xl font-black text-gray-800 leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="relative pt-4">
                <input type="text" 
                       name="q-${question.id || index}" 
                       placeholder="INPUT TELEMETRY DATA..."
                       autocomplete="off"
                       class="w-full p-8 bg-gray-50 border-2 border-transparent rounded-[40px] text-lg font-black text-purple-900 uppercase tracking-tight placeholder:text-gray-300 outline-none focus:bg-white focus:border-purple-500 transition-all shadow-inner">
                <div class="absolute right-10 top-1/2 -translate-y-1/2 mt-2 text-purple-100 pointer-events-none">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
            </div>
        </div>
    `;
};

