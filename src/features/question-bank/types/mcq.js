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
                    <label class="relative flex items-center p-6 bg-gray-50/50 border border-transparent rounded-[32px] cursor-pointer transition-all hover:bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 group/choice">
                        <input type="radio" 
                               name="q-${question.id}" 
                               value="${choice.id}" 
                               class="peer hidden">
                        <div class="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-gray-400 transition-all peer-checked:bg-purple-600 peer-checked:text-white peer-checked:scale-110 shadow-sm mr-6 group-hover/choice:border-purple-200">
                            ${String.fromCharCode(65 + i)}
                        </div>
                        <span class="text-sm font-black text-gray-600 uppercase tracking-tight transition-all peer-checked:text-purple-900">${choice.text}</span>
                    </label>
                `).join('')}
            </div>
        `;
    } else if (isBankMode) {
        // Answer Bank Mode
        inputArea = `
            <div class="relative group/bank">
                <select name="q-${question.id}" 
                        class="w-full p-8 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-[40px] text-sm font-black text-blue-900 uppercase tracking-widest appearance-none outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                    <option value="">-- RETRIEVE FROM BANK --</option>
                    ${section.answerBank.map(ans => `<option value="${ans}">${ans}</option>`).join('')}
                </select>
                <div class="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300 transition-transform group-hover/bank:translate-x-1">
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
                       class="w-full p-8 bg-gray-50 border-2 border-transparent rounded-[40px] text-lg font-black text-purple-900 uppercase tracking-tight placeholder:text-gray-300 outline-none focus:bg-white focus:border-purple-500 transition-all shadow-inner">
                <div class="absolute right-10 top-1/2 -translate-y-1/2 text-purple-100 pointer-events-none">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
            </div>
        `;
    }

    return `
        <div class="space-y-8">
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100">${hasChoices ? 'Operational' : 'Identification'}</span>
                    ${isBankMode ? '<span class="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100 italic">Banked</span>' : ''}
                </div>
                <div class="text-2xl font-black text-gray-800 leading-tight uppercase tracking-tight q-content">
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
