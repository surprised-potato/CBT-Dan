export const renderMCQ = (question, index = 1) => {
    // Expects: question.text, question.choices [{id, text}, ...]
    return `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div class="mb-4">
                <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold mb-2">MCQ</span>
                <p class="text-lg font-medium text-gray-800"><span class="font-bold text-gray-400 mr-2">${index}.</span> ${question.text}</p>
            </div>
            <div class="space-y-3 pl-4">
                ${question.choices.map(choice => `
                    <div class="flex items-center group cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input 
                            type="radio" 
                            name="q-${question.id || index}" 
                            id="${choice.id}" 
                            value="${choice.id}"
                            class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                        >
                        <label for="${choice.id}" class="ml-3 block text-gray-700 w-full cursor-pointer">${choice.text}</label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};
