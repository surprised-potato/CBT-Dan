export const renderIdentification = (question, index = 1) => {
    return `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
             <div class="mb-4">
                <span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-bold mb-2">Identification</span>
                <p class="text-lg font-medium text-gray-800"><span class="font-bold text-gray-400 mr-2">${index}.</span> ${question.text}</p>
            </div>
            <div class="pl-4">
                <input 
                    type="text" 
                    name="q-${question.id || index}"
                    class="w-full p-3 border-b-2 border-gray-200 focus:border-purple-500 outline-none transition-colors bg-transparent text-gray-800 placeholder-gray-400"
                    placeholder="Type your answer here..."
                    autocomplete="off"
                >
            </div>
        </div>
    `;
};
