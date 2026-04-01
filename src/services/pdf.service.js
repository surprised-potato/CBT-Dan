import * as printRenderers from '../features/printable/print-renderers.js';

export const buildPrintableHTML = (assessment, options = {}) => {
    const {
        showAnswers = false,
        instructorName = "Professor / Instructor",
        layout = {
            paperSize: 'folio',
            columns: 2,
            fontSize: 'sm',
            margin: 'tight',
            spacing: 'compact',
            choiceFlow: 'grid'
        }
    } = options;

    const questions = assessment.questions || [];
    const keys = assessment.keys || {};
    const sections = assessment.sections || [];

    const sectionedQuestions = sections.length > 0
        ? sections.map((s, i) => ({ ...s, items: questions.filter(q => q.sectionIdx === i) }))
        : [{ title: 'Examination Items', items: questions }];

    // Config Mapping
    const fontSizeMap = { 'xs': 'text-[9px]', 'sm': 'text-[11px]', 'base': 'text-[13px]' };
    const marginMap = { 'tight': 'p-4', 'normal': 'p-8', 'wide': 'p-12' };
    const gapMap = { 'compact': 'gap-4', 'normal': 'gap-8' };

    const header = `
        <div class="print-header pb-4 mb-2">
            <div class="flex items-center justify-between mb-4">
                <img src="UNO-R_logo.png" class="h-20 object-contain" />
                <div class="text-center flex-1 px-4 leading-tight uppercase font-bold">
                    <p class="text-[10px]">University of</p>
                    <p class="text-[12px]">Negros Occidental &ndash; Recoletos, Incorporated</p>
                    <p class="text-[9px] italic normal-case">CHED Autonomous University</p>
                    <p class="text-[11px] mt-1">College of Engineering</p>
                </div>
                <img src="coeng%20logo.jpg" class="h-20 object-contain" />
            </div>
            
            <table class="w-full text-[10px] border-collapse border border-black mb-4">
                <tbody>
                    <tr>
                        <td class="border border-black p-1 font-bold w-[15%]">COURSE CODE:</td>
                        <td class="border border-black p-1 w-[35%]"></td>
                        <td class="border border-black p-1 font-bold w-[15%]">SECTION:</td>
                        <td class="border border-black p-1 w-[35%]"></td>
                    </tr>
                    <tr>
                        <td class="border border-black p-1 font-bold">COURSE TITLE:</td>
                        <td class="border border-black p-1" colspan="3"></td>
                    </tr>
                    <tr>
                        <td class="border border-black p-1 text-center font-bold" colspan="2">AY 2025-2026</td>
                        <td class="border border-black p-1 text-center font-bold">PRELIM</td>
                        <td class="border border-black p-1 text-center font-bold">EXAMINATION</td>
                    </tr>
                </tbody>
            </table>

            <table class="w-full text-[10px] border-collapse border border-black">
                <tbody>
                    <tr>
                        <td class="border border-black p-1 font-bold w-[60%] align-top h-8">NAME:</td>
                        <td class="border border-black p-1 font-bold w-[20%] align-top" rowspan="2">DATE:</td>
                        <td class="border border-black p-1 font-bold w-[20%] align-top" rowspan="2">SCORE:</td>
                    </tr>
                    <tr>
                        <td class="border border-black p-1 font-bold align-top h-8">INSTRUCTOR'S NAME:</td>
                    </tr>
                </tbody>
            </table>
            
            ${showAnswers ? `
            <div class="mt-4 text-right">
                <span class="bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Answer Key</span>
            </div>
            ` : ''}
        </div>
    `;

    const content = sectionedQuestions.map((section, sIdx) => {
        let questionIdxOffset = sectionedQuestions.slice(0, sIdx).reduce((acc, s) => acc + s.items.length, 0);

        const sectionHeader = `
            <div class="mb-3 border-b border-gray-200">
                <h2 class="text-sm font-bold uppercase tracking-tight">${section.title || 'Section ' + (sIdx + 1)}</h2>
                <p class="text-[9px] font-bold italic mb-1">${section.items.length} items • ${section.pointsPerQuestion || 1} pts/item</p>
            </div>
        `;

        const itemsHTML = section.items.map((q, qIdx) => {
            const absoluteIdx = questionIdxOffset + qIdx + 1;
            const qWithKey = { ...q, correctAnswer: keys[q.id] };

            let html = '';
            let isFullWidth = q.type === 'MATCHING';

            if (q.type === 'MCQ') html = printRenderers.printMCQ(qWithKey, absoluteIdx, showAnswers, layout);
            else if (q.type === 'TRUE_FALSE') html = printRenderers.printTrueFalse(qWithKey, absoluteIdx, showAnswers);
            else if (q.type === 'IDENTIFICATION') html = printRenderers.printIdentification(qWithKey, absoluteIdx, showAnswers);
            else if (q.type === 'MATCHING') html = printRenderers.printMatching(qWithKey, absoluteIdx, showAnswers);
            else if (q.type === 'ORDERING') html = printRenderers.printOrdering(qWithKey, absoluteIdx, showAnswers);
            else if (q.type === 'MULTI_ANSWER') html = printRenderers.printMultiAnswer(qWithKey, absoluteIdx, showAnswers, layout);
            else html = `<div class="text-red-500 font-bold">[!]</div>`;

            return `
                <div class="print-item-wrapper ${isFullWidth ? 'col-span-full mb-4' : 'mb-3'} break-inside-avoid">
                    ${html}
                </div>
            `;
        }).join('');

        return `
            <section class="section-container mb-6">
                ${sectionHeader}
                <div class="${layout.columns > 1 ? `grid grid-cols-${layout.columns} gap-x-8 gap-y-2` : 'space-y-2'}">
                    ${itemsHTML}
                </div>
            </section>
        `;
    }).join('');

    const totalQuestionsCount = sectionedQuestions.reduce((acc, s) => acc + s.items.length, 0);
    const allQuestionsFlat = sectionedQuestions.flatMap(s => s.items);
    
    const answerGridItems = Array.from({ length: totalQuestionsCount }, (_, i) => {
        const idx = i + 1;
        const q = allQuestionsFlat[i];
        let answerText = '';
        if (showAnswers && q) {
            const key = keys[q.id];
            
            let displayKey = key;
            if (q.type === 'MCQ' && key && q.choices) {
                const choiceIdx = q.choices.findIndex(c => c.id === key);
                if (choiceIdx !== -1) displayKey = String.fromCharCode(65 + choiceIdx);
            } else if (Array.isArray(key)) {
                displayKey = key.join(', ');
            }
            
            answerText = displayKey ? `<span class="text-red-500 font-bold ml-2 text-[12px] break-all line-clamp-1">${displayKey}</span>` : '';
        }        return `
            <div class="flex items-end mb-4 break-inside-avoid" style="page-break-inside: avoid; break-inside: avoid-column;">
                <span class="font-bold w-6 text-right mr-3 text-sm">${idx}.</span>
                <div class="border-b border-black flex-1 h-5 flex items-end pb-0.5 relative">
                     ${answerText}
                </div>
            </div>
        `;
    }).join('');

    const answerSheetHTML = totalQuestionsCount > 0 ? `
        <div class="print-answer-sheet mt-12 pt-8" style="page-break-before: always; break-before: page;">
            <div class="text-center mb-8 border-b-2 border-black pb-4">
                <h2 class="text-xl font-black uppercase tracking-widest">Examination Answer Sheet</h2>
                <div class="grid grid-cols-2 gap-8 mt-8 text-left max-w-3xl mx-auto">
                    <div class="flex items-end"><span class="font-bold text-[11px] mr-2">NAME:</span><div class="border-b border-black flex-1"></div></div>
                    <div class="flex items-end"><span class="font-bold text-[11px] mr-2">COURSE/SEC:</span><div class="border-b border-black flex-1"></div></div>
                    <div class="flex items-end"><span class="font-bold text-[11px] mr-2">DATE:</span><div class="border-b border-black flex-1"></div></div>
                    <div class="flex items-end"><span class="font-bold text-[11px] mr-2">SCORE:</span><div class="border-b border-black flex-1"></div></div>
                </div>
            </div>
            
            <div class="columns-3 sm:columns-4 md:columns-5 gap-x-12 mt-8" style="column-gap: 3rem;">
                ${answerGridItems}
            </div>
            
            <div class="mt-12 text-center text-[9px] italic text-gray-500">
                Ensure all answers are written clearly. Erasures may invalidate your answer depending on the instructor's policy.
            </div>
        </div>
    ` : '';

    const footer = `
        <div class="mt-8 pt-4 border-t border-gray-100 text-center">
            <p class="text-[7px] font-bold text-gray-300 uppercase tracking-[0.4em]">Protocol Transmit Lock - ${assessment.id.substring(0, 8)}</p>
        </div>
    `;

    // Paper size classes: we apply width and min-height for preview
    const paperSizeStyles = {
        'folio': 'width: 215.9mm; min-height: 330.2mm;',
        'a4': 'width: 210mm; min-height: 297mm;',
        'letter': 'width: 215.9mm; min-height: 279.4mm;'
    };

    return `
        <style>
            .printable-document * {
                box-sizing: border-box;
            }
            .print-item-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid-page !important;
                display: block;
                width: 100%;
                position: relative;
                padding-top: 1px; /* Tiny buffer to prevent top-clipping */
                overflow: visible; 
            }
            .section-container {
                page-break-inside: auto;
                overflow: visible;
            }
            @media print {
                .print-item-wrapper {
                    page-break-inside: avoid !important;
                }
            }
        </style>
        <div class="printable-document bg-white mx-auto text-black font-serif leading-tight ${marginMap[layout.margin]} ${fontSizeMap[layout.fontSize]}" 
             style="${paperSizeStyles[layout.paperSize || 'folio']}">
            ${header}
            ${content}
            ${answerSheetHTML}
            ${footer}
        </div>
    `;
};

export const downloadPDF = (element, options = {}) => {
    const {
        filename = 'assessment.pdf',
        paperSize = 'folio'
    } = options;

    const paperFormats = {
        'folio': [215.9, 330.2],
        'a4': 'a4',
        'letter': 'letter'
    };

    // CLONE APPROACH: This is the most robust way to fix blank pages.
    const clone = element.cloneNode(true);
    const docEl = clone.querySelector('.printable-document');

    // Create a temporary container that is hidden but at the top of the body
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = docEl ? docEl.style.width : '215.9mm';
    container.style.background = 'white';

    if (docEl) {
        docEl.style.margin = '0';
        docEl.style.boxShadow = 'none';
        docEl.classList.remove('mx-auto');
    }

    container.appendChild(clone);
    document.body.appendChild(container);

    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0
        },
        jsPDF: { unit: 'mm', format: paperFormats[paperSize], orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(clone).save().then(() => {
        document.body.removeChild(container);
    }).catch(err => {
        console.error("PDF Export Failure:", err);
        document.body.removeChild(container);
    });
};
