/**
 * Ultra-compact print renderers for maximum question density.
 */

const normalize = (str) => String(str || '').trim().toLowerCase();

export const printMCQ = (q, idx, showAnswer = false, layout = {}) => {
    const { choiceFlow = 'grid' } = layout;
    const containerClass = choiceFlow === 'inline'
        ? 'ml-2 flex flex-wrap gap-x-4 gap-y-0.5'
        : 'ml-2 grid grid-cols-2 gap-x-2 gap-y-0.5';

    return `
        <div class="print-question">
            <p class="font-bold mb-1 leading-tight text-[11px]">${idx}. ${q.text}</p>
            <div class="${containerClass}">
                ${(q.choices || []).map((c, i) => {
        const label = String.fromCharCode(65 + i);
        const isCorrect = showAnswer && (c.id === q.correctAnswer || c.text === q.correctAnswer);
        return `
                        <div class="flex items-start">
                            <span class="mr-1 text-[10px] leading-none">${isCorrect ? '●' : '○'}</span>
                            <span class="text-[9px] leading-tight whitespace-nowrap">${label}. ${c.text}</span>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
};

export const printTrueFalse = (q, idx, showAnswer = false) => {
    const isTrue = showAnswer && (q.correctAnswer === true || normalize(q.correctAnswer) === 'true');
    const isFalse = showAnswer && (q.correctAnswer === false || normalize(q.correctAnswer) === 'false');
    return `
        <div class="print-question">
            <p class="font-bold mb-1 leading-tight text-[11px]">${idx}. ${q.text}</p>
            <div class="ml-2 flex gap-4 text-[9px]">
                <div>${isTrue ? '●' : '○'} T</div>
                <div>${isFalse ? '●' : '○'} F</div>
            </div>
        </div>
    `;
};

export const printIdentification = (q, idx, showAnswer = false) => {
    const answer = showAnswer ? (Array.isArray(q.correctAnswer) ? q.correctAnswer.join('/') : q.correctAnswer) : '';
    return `
        <div class="print-question">
            <p class="font-bold mb-0.5 leading-tight text-[11px]">${idx}. ${q.text}</p>
            <div class="ml-2">
                <p class="border-b border-black min-h-[1.2rem] mt-0.5 text-[10px]">${answer}</p>
            </div>
        </div>
    `;
};

export const printMatching = (q, idx, showAnswer = false) => {
    // HYPER-RESILIENT EXTRACTION:
    // 1. Get source of truth (pairs). Use keys if content was stripped.
    const keys = (q.correctAnswer && Array.isArray(q.correctAnswer)) ? q.correctAnswer :
        (q.correctAnswer ? [q.correctAnswer] : []);
    const sourcePairs = (keys.length > 0) ? keys : (q.pairs || []);

    // 2. Extract Terms (Column A)
    let terms = sourcePairs.map(p => p.term || p.premise || p.item || (typeof p === 'string' ? p : ''));
    if (terms.length === 0) terms = q.matchingTerms || [];

    // 3. Extract Definitions (Column B)
    let definitions = sourcePairs.map(p => p.definition || p.response || p.correlate || (typeof p === 'string' ? p : ''));
    if (definitions.length === 0) definitions = q.matchingDefinitions || [];

    // 4. Shuffling Column B
    // Use pre-shuffled definitions if available (student paper view)
    const shuffledDefs = (q.matchingDefinitions && q.matchingDefinitions.length > 0 && !showAnswer)
        ? q.matchingDefinitions
        : [...definitions].sort(() => Math.random() - 0.5);

    return `
        <div class="print-question col-span-2 mt-2">
            <p class="font-bold mb-1 leading-tight underline uppercase text-[10px]">${idx}. Matching: ${q.text}</p>
            <div class="grid grid-cols-2 gap-4 ml-2">
                <div class="space-y-0.5">
                    ${terms.map((term, i) => {
        let letter = '____';
        if (showAnswer && keys.length > 0) {
            const pair = keys.find(p => (p.term || p.premise || p) === term);
            if (pair) {
                const defVal = pair.definition || pair.response || pair;
                const defIdx = shuffledDefs.indexOf(defVal);
                if (defIdx !== -1) letter = String.fromCharCode(65 + defIdx);
            }
        }
        return `<div class="flex items-center gap-1 text-[9px]">
                                    <span class="font-bold text-nowrap">${i + 1}. [ ${letter} ]</span>
                                    <span class="truncate">${term}</span>
                                </div>`;
    }).join('')}
                </div>
                <div class="space-y-0.5">
                    ${shuffledDefs.map((def, i) => `
                        <div class="flex items-start gap-1 text-[9px] leading-tight">
                            <span class="font-bold">${String.fromCharCode(65 + i)}.</span>
                            <span class="line-clamp-2">${def}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

export const printOrdering = (q, idx, showAnswer = false) => {
    // Hyper-resilient items extraction
    const keys = (q.correctAnswer && Array.isArray(q.correctAnswer)) ? q.correctAnswer :
        (q.correctAnswer ? [q.correctAnswer] : []);

    let items = (showAnswer && keys.length > 0) ? keys : (q.orderingItems || q.items || []);

    // Last resort fallback: if items are stripped and no safe field exists, use keys but shuffle
    if (items.length === 0 && keys.length > 0) {
        items = [...keys].sort(() => Math.random() - 0.5);
    }

    return `
        <div class="print-question">
            <p class="font-bold mb-1 leading-tight text-[11px]">${idx}. ${q.text}</p>
            <div class="ml-2 space-y-0.5">
                ${items.map((item, i) => {
        const order = showAnswer && keys.length > 0 ? (keys.indexOf(item) + 1) : ' ';
        return `
                        <div class="flex items-center gap-1 text-[9px]">
                            <span class="border border-black px-1 min-w-[1.2rem] text-center font-bold">${order}</span>
                            <span>${item}</span>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
};

export const printMultiAnswer = (q, idx, showAnswer = false, layout = {}) => {
    const { choiceFlow = 'grid' } = layout;
    const containerClass = choiceFlow === 'inline'
        ? 'ml-2 flex flex-wrap gap-x-4 gap-y-0.5'
        : 'ml-2 grid grid-cols-2 gap-x-2 gap-y-0.5';

    return `
        <div class="print-question">
            <p class="font-bold mb-1 leading-tight text-[11px]">${idx}. ${q.text}</p>
            <div class="${containerClass}">
                ${(q.choices || []).map((c, i) => {
        const label = String.fromCharCode(65 + i);
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        const isCorrect = showAnswer && correctAnswers.some(ans => ans === c.id || ans === c.text);
        return `
                        <div class="flex items-start">
                            <span class="mr-1 text-[10px] leading-none">${isCorrect ? '■' : '□'}</span>
                            <span class="text-[9px] leading-tight whitespace-nowrap">${label}. ${c.text}</span>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
};
