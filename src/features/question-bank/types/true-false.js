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
                    <span class="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100">Binary Protocol</span>
                </div>
                <div class="text-2xl font-black text-gray-800 leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="grid grid-cols-2 gap-6 pt-4">
                <label class="relative group/tf cursor-pointer">
                    <input type="radio" name="q-${question.id}" value="true" class="peer hidden">
                    <div class="p-8 bg-gray-50/50 border-2 border-transparent rounded-[40px] flex flex-col items-center gap-4 transition-all peer-checked:bg-green-50 peer-checked:border-green-200 peer-checked:shadow-xl peer-checked:shadow-green-50 group-hover/tf:bg-white group-hover/tf:border-green-100">
                        <div class="w-16 h-16 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-2xl transition-all peer-checked:bg-green-500 peer-checked:text-white shadow-sm">✓</div>
                        <span class="text-xs font-black text-gray-400 uppercase tracking-[0.3em] peer-checked:text-green-700">Affirmative</span>
                    </div>
                </label>
                <label class="relative group/tf cursor-pointer">
                    <input type="radio" name="q-${question.id}" value="false" class="peer hidden">
                    <div class="p-8 bg-gray-50/50 border-2 border-transparent rounded-[40px] flex flex-col items-center gap-4 transition-all peer-checked:bg-red-50 peer-checked:border-red-200 peer-checked:shadow-xl peer-checked:shadow-red-50 group-hover/tf:bg-white group-hover/tf:border-red-100">
                        <div class="w-16 h-16 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-2xl transition-all peer-checked:bg-red-500 peer-checked:text-white shadow-sm">×</div>
                        <span class="text-xs font-black text-gray-400 uppercase tracking-[0.3em] peer-checked:text-red-700">Negative</span>
                    </div>
                </label>
            </div>
        </div>
    `;
};
