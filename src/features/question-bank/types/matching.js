export const renderMatching = (question, index = 1) => {
    // Student context (from assessment_content): matchingTerms and matchingDefinitions exist
    // Editor context (from question-bank): pairs exists
    const terms = question.matchingTerms || (question.pairs || []).map(p => p.term);
    const definitions = question.matchingDefinitions || (question.pairs || []).map(p => p.definition);

    // Shuffled pool for the dropdowns
    // If matchingDefinitions exists, it's already shuffled by the service
    const shuffledDefs = question.matchingDefinitions || [...definitions].sort(() => Math.random() - 0.5);

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
                    <span class="px-3 py-1 bg-cyan-900/40 text-cyan-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-cyan-500/30">Relational Mapping</span>
                </div>
                <div class="text-2xl font-black text-white leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="space-y-4 pt-4">
                ${terms.map((term, i) => `
                    <div class="flex flex-col sm:flex-row gap-4 items-stretch group/pair">
                        <div class="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center shadow-lg group-hover/pair:border-cyan-500/50 transition-all backdrop-blur-sm">
                            <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-[10px] mr-4 shadow-inner border border-cyan-500/30">${i + 1}</span>
                            <span class="text-xs font-black text-gray-200 uppercase tracking-tight">${term}</span>
                        </div>
                        <div class="flex-1 relative">
                            <select name="q-${question.id}-pair-${i}" 
                                    class="matching-select w-full h-full p-6 bg-black/40 border border-white/10 rounded-3xl text-xs font-black text-cyan-300 uppercase tracking-tight appearance-none outline-none focus:bg-black/60 focus:border-cyan-500 transition-all cursor-pointer shadow-inner">
                                <option value="" class="bg-[#0f172a] text-gray-400">-- CORRELATE --</option>
                                ${shuffledDefs.map(def => `<option value="${def}" class="bg-[#0f172a] text-white">${def}</option>`).join('')}
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
