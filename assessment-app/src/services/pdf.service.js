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
        <div class="print-header border-b-2 border-black pb-4 mb-2">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-xl font-bold uppercase">${assessment.title}</h1>
                    <p class="text-[10px] font-bold mt-1">Instructor: ${instructorName}</p>
                </div>
                <div class="text-right">
                    <p class="text-[8px] font-bold uppercase">Academic Registry Protocol</p>
                    <p class="text-[8px] mt-0.5">${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                </div>
            </div>
            
            ${!showAnswers ? `
            <div class="grid grid-cols-2 gap-4 mt-4">
                <div class="border-b border-black py-0.5"><span class="text-[9px] font-bold uppercase mr-1">Name:</span></div>
                <div class="grid grid-cols-2 gap-2">
                    <div class="border-b border-black py-0.5"><span class="text-[9px] font-bold uppercase mr-1">Sec:</span></div>
                    <div class="border-b border-black py-0.5"><span class="text-[9px] font-bold uppercase mr-1">Score:</span> <span class="text-[9px] font-bold">___/${assessment.questionCount}</span></div>
                </div>
            </div>
            ` : `
            <div class="mt-2 text-right">
                <span class="bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">Answer Key</span>
            </div>
            `}
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
