export const renderTrueFalse = (question, index = 1) => {
    // Similar to MCQ but fixed choices
    return `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div class="mb-4">
                <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold mb-2">True / False</span>
                <p class="text-lg font-medium text-gray-800"><span class="font-bold text-gray-400 mr-2">${index}.</span> ${question.text}</p>
            </div>
            <div class="flex gap-4 pl-4">
                <div class="flex-1">
                    <input type="radio" name="q-${question.id || index}" id="t-${index}" value="true" class="peer hidden">
                    <label for="t-${index}" class="block text-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all font-semibold text-gray-600">
                        TRUE
                    </label>
                </div>
                <div class="flex-1">
                    <input type="radio" name="q-${question.id || index}" id="f-${index}" value="false" class="peer hidden">
                    <label for="f-${index}" class="block text-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 transition-all font-semibold text-gray-600">
                        FALSE
                    </label>
                </div>
            </div>
        </div>
    `;
};
