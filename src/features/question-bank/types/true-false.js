export const renderTrueFalse = (question, index = 1) => {
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
                    <span class="px-3 py-1 bg-green-900/40 text-green-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/30">Binary Protocol</span>
                </div>
                <div class="text-2xl font-black text-white leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="grid grid-cols-2 gap-6 pt-4">
                <label class="relative group/tf cursor-pointer">
                    <input type="radio" name="q-${question.id}" value="true" class="peer hidden">
                    <div class="p-8 bg-black/40 border border-white/10 rounded-[40px] flex flex-col items-center gap-4 transition-all peer-checked:bg-green-900/40 peer-checked:border-green-500/50 peer-checked:shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover/tf:bg-white/5 group-hover/tf:border-green-500/30 backdrop-blur-sm">
                        <div class="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl transition-all text-gray-600 peer-checked:bg-green-500 peer-checked:text-white peer-checked:border-green-400 shadow-inner">✓</div>
                        <span class="text-xs font-black text-gray-500 uppercase tracking-[0.3em] peer-checked:text-green-300">Affirmative</span>
                    </div>
                </label>
                <label class="relative group/tf cursor-pointer">
                    <input type="radio" name="q-${question.id}" value="false" class="peer hidden">
                    <div class="p-8 bg-black/40 border border-white/10 rounded-[40px] flex flex-col items-center gap-4 transition-all peer-checked:bg-red-900/40 peer-checked:border-red-500/50 peer-checked:shadow-[0_0_15px_rgba(239,68,68,0.3)] group-hover/tf:bg-white/5 group-hover/tf:border-red-500/30 backdrop-blur-sm">
                        <div class="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl transition-all text-gray-600 peer-checked:bg-red-500 peer-checked:text-white peer-checked:border-red-400 shadow-inner">×</div>
                        <span class="text-xs font-black text-gray-500 uppercase tracking-[0.3em] peer-checked:text-red-300">Negative</span>
                    </div>
                </label>
            </div>
        </div>
    `;
};
