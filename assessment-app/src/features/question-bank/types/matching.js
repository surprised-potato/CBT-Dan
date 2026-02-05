export const renderMatching = (question, index = 1) => {
    // Determine the pool of definitions (shuffled)
    const definitions = (question.pairs || []).map(p => p.definition);
    const shuffledDefs = [...definitions].sort(() => Math.random() - 0.5);

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
                    <span class="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-cyan-100">Relational Mapping</span>
                </div>
                <div class="text-2xl font-black text-gray-800 leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="space-y-4 pt-4">
                ${(question.pairs || []).map((pair, i) => `
                    <div class="flex flex-col sm:flex-row gap-4 items-stretch group/pair">
                        <div class="flex-1 p-6 bg-white border border-gray-100 rounded-3xl flex items-center shadow-sm group-hover/pair:border-cyan-200 transition-all">
                            <span class="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center font-black text-[10px] mr-4 shadow-inner">${i + 1}</span>
                            <span class="text-xs font-black text-gray-700 uppercase tracking-tight">${pair.term}</span>
                        </div>
                        <div class="flex-1 relative">
                            <select name="q-${question.id}-pair-${i}" 
                                    class="matching-select w-full h-full p-6 bg-gray-50/50 border border-transparent rounded-3xl text-xs font-black text-cyan-900 uppercase tracking-tight appearance-none outline-none focus:bg-white focus:border-cyan-500 transition-all cursor-pointer shadow-inner">
                                <option value="">-- CORRELATE --</option>
                                ${shuffledDefs.map(def => `<option value="${def}">${def}</option>`).join('')}
                            </select>
                            <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-200">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <p class="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center italic">Map each premise to its unique correlate</p>
        </div>
    `;
};
