export const renderMCQ = (question, index = 1, section = {}) => {
    // Determine Mode
    const hasChoices = question.choices && question.choices.length > 0;
    const isBankMode = section.answerBankMode && section.answerBank;

    // Figure Rendering
    const figures = (question.figures || []).map(f => `
        <div class="relative group/fig rounded-4xl overflow-hidden border-8 border-white shadow-2xl mb-8">
            <img src="${f}" class="w-full h-auto object-cover transition-transform duration-700 group-hover/fig:scale-110">
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
    `).join('');

    let inputArea = '';

    if (hasChoices) {
        // Standard MCQ
        inputArea = `
            <div class="grid grid-cols-1 gap-4">
                ${question.choices.map((choice, i) => `
                    <label class="relative flex items-center p-6 bg-white/5 border border-white/10 rounded-[32px] cursor-pointer transition-all hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] group/choice backdrop-blur-sm">
                        <input type="radio" 
                               name="q-${question.id}" 
                               value="${choice.id}" 
                               class="peer hidden">
                        <div class="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center font-black text-gray-500 transition-all peer-checked:bg-purple-600 peer-checked:text-white peer-checked:border-purple-400 peer-checked:scale-110 shadow-inner mr-6 group-hover/choice:border-purple-500/50">
                            ${String.fromCharCode(65 + i)}
                        </div>
                        <span class="text-sm font-black text-gray-300 uppercase tracking-tight transition-all peer-checked:text-white">${choice.text}</span>
                    </label>
                `).join('')}
            </div>
        `;
    } else if (isBankMode) {
        // Answer Bank Mode
        inputArea = `
            <div class="relative group/bank">
                <select name="q-${question.id}" 
                        class="w-full p-8 bg-black/40 border border-white/10 rounded-[40px] text-sm font-black text-cyan-300 uppercase tracking-widest appearance-none outline-none focus:border-cyan-500 focus:bg-black/60 transition-all cursor-pointer shadow-inner">
                    <option value="" class="bg-[#0f172a] text-gray-400">-- RETRIEVE FROM BANK --</option>
                    ${section.answerBank.map(ans => `<option value="${ans}" class="bg-[#0f172a] text-white">${ans}</option>`).join('')}
                </select>
                <div class="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500 transition-transform group-hover/bank:translate-x-1">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        `;
    } else {
        // Identification Mode
        inputArea = `
            <div class="relative">
                <input type="text" 
                       name="q-${question.id}" 
                       placeholder="INPUT TELEMETRY DATA..."
                       class="w-full p-8 bg-black/40 border border-white/10 rounded-[40px] text-lg font-black text-white uppercase tracking-tight placeholder:text-gray-600 outline-none focus:bg-black/60 focus:border-purple-500 transition-all shadow-inner">
                <div class="absolute right-10 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
            </div>
        `;
    }

    return `
        <div class="space-y-8">
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 bg-indigo-900/40 text-indigo-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-500/30">${hasChoices ? 'Operational' : 'Identification'}</span>
                    ${isBankMode ? '<span class="px-3 py-1 bg-amber-900/40 text-amber-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-500/30 italic">Banked</span>' : ''}
                </div>
                <div class="text-2xl font-black text-white leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="pt-4">
                ${inputArea}
            </div>
        </div>
    `;
};
