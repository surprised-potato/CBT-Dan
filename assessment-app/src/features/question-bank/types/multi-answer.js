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
                    <span class="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-100">Multi-Vector Choice</span>
                </div>
                <div class="text-2xl font-black text-gray-800 leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="grid grid-cols-1 gap-4 pt-4">
                ${question.choices.map((choice, i) => `
                    <label class="relative flex items-center p-6 bg-gray-50/50 border border-transparent rounded-[32px] cursor-pointer transition-all hover:bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 group/choice">
                        <input type="checkbox" 
                               name="q-${question.id}" 
                               value="${choice.id}" 
                               class="peer hidden">
                        <div class="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-gray-400 transition-all peer-checked:bg-purple-600 peer-checked:text-white peer-checked:scale-110 shadow-sm mr-6 group-hover/choice:border-purple-200">
                             ${String.fromCharCode(65 + i)}
                        </div>
                        <span class="text-sm font-black text-gray-600 uppercase tracking-tight transition-all peer-checked:text-purple-900">${choice.text}</span>
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
