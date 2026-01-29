export const renderInput = ({ id, type = 'text', label, placeholder = '', value = '', required = false }) => {
    return `
        <div class="flex flex-col gap-1 mb-4">
            ${label ? `<label for="${id}" class="text-sm font-medium text-gray-700">${label}</label>` : ''}
            <input 
                id="${id}" 
                type="${type}" 
                placeholder="${placeholder}" 
                value="${value}"
                ${required ? 'required' : ''}
                class="w-full p-4 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
            >
        </div>
    `;
};
