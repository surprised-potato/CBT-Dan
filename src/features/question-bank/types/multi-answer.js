export const renderMultiAnswer = (question, index = 1) => {
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
                    <span class="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-500/30">Multi-Vector Choice</span>
                </div>
                <div class="text-2xl font-black text-white leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="grid grid-cols-1 gap-4 pt-4">
                ${question.choices.map((choice, i) => `
                    <label class="relative flex items-center p-6 bg-white/5 border border-white/10 rounded-[32px] cursor-pointer transition-all hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] group/choice backdrop-blur-sm">
                        <input type="checkbox" 
                               name="q-${question.id}" 
                               value="${choice.id}" 
                               class="peer hidden">
                        <div class="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center font-black text-gray-500 transition-all peer-checked:bg-purple-600 peer-checked:text-white peer-checked:border-purple-400 peer-checked:scale-110 shadow-inner mr-6 group-hover/choice:border-purple-500/50">
                             ${String.fromCharCode(65 + i)}
                        </div>
                        <span class="text-sm font-black text-gray-300 uppercase tracking-tight transition-all peer-checked:text-white">${choice.text}</span>
                        <div class="absolute right-8 opacity-0 peer-checked:opacity-100 transition-opacity text-purple-400">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </label>
                `).join('')}
            </div>
            <p class="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center italic">Multiple correct selections may be required</p>
        </div>
    `;
};
