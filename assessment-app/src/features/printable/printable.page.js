import { getAssessmentWithKeys } from '../../services/assessment.service.js';
import { buildPrintableHTML, downloadPDF } from '../../services/pdf.service.js';
import { renderButton } from '../../shared/button.js';
import { getUser } from '../../core/store.js';

export const PrintablePage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');
    const mode = params.get('mode') || 'student';
    const showAnswers = mode === 'key';

    if (!id) {
        app.innerHTML = '<div class="p-20 text-center font-black text-red-500 uppercase">PROTOCOL ERROR: MISSING ASSESSMENT ID</div>';
        return;
    }

    // Layout State
    let layoutConfig = {
        paperSize: 'folio',
        columns: 2,
        fontSize: 'sm',
        margin: 'tight',
        spacing: 'compact',
        choiceFlow: 'grid' // grid or inline
    };

    let assessmentData = null;

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
            <header class="print-toolbar bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
                <div class="flex items-center gap-4">
                    <button onclick="window.history.back()" class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <h1 class="text-sm font-black uppercase tracking-widest text-gray-900">Print Protocol</h1>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${showAnswers ? 'Answer Key' : 'Test Paper'}</p>
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button id="print-now-btn" class="px-5 py-2 bg-gray-100 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all border border-gray-200">Print</button>
                    <button id="download-pdf-btn" class="px-5 py-2 bg-purple-premium text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all">Export PDF</button>
                </div>
            </header>

            <div class="flex flex-grow overflow-hidden">
                <!-- Settings Panel -->
                <aside class="print-toolbar w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                    <section>
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Paper Format</h3>
                        <div class="space-y-2">
                            ${['folio', 'a4', 'letter'].map(size => `
                                <button data-setting="paperSize" data-value="${size}" class="layout-btn w-full text-left px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${layoutConfig.paperSize === size ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}">${size}</button>
                            `).join('')}
                        </div>
                    </section>

                    <section>
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Column Flow</h3>
                        <div class="grid grid-cols-2 gap-2">
                            ${[1, 2].map(cols => `
                                <button data-setting="columns" data-value="${cols}" class="layout-btn px-4 py-2 rounded-lg text-xs font-bold transition-all ${layoutConfig.columns == cols ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}">${cols} Col</button>
                            `).join('')}
                        </div>
                    </section>

                    <section>
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Choice Layout</h3>
                        <div class="grid grid-cols-2 gap-2">
                            ${['grid', 'inline'].map(flow => `
                                <button data-setting="choiceFlow" data-value="${flow}" class="layout-btn px-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${layoutConfig.choiceFlow === flow ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}">${flow === 'grid' ? '2-Cols' : 'Autofit'}</button>
                            `).join('')}
                        </div>
                    </section>

                    <section>
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Density (Font)</h3>
                        <div class="grid grid-cols-3 gap-1">
                            ${['xs', 'sm', 'base'].map(f => `
                                <button data-setting="fontSize" data-value="${f}" class="layout-btn px-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${layoutConfig.fontSize === f ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}">${f}</button>
                            `).join('')}
                        </div>
                    </section>

                    <section>
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Margins</h3>
                        <div class="grid grid-cols-2 gap-2">
                            ${['tight', 'normal'].map(m => `
                                <button data-setting="margin" data-value="${m}" class="layout-btn px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${layoutConfig.margin === m ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}">${m}</button>
                            `).join('')}
                        </div>
                    </section>

                    <p class="mt-auto text-[8px] leading-relaxed text-gray-400 font-bold uppercase tracking-tighter">Adjust settings to maximize question density on each page.</p>
                </aside>

                <!-- Preview Area -->
                <div class="flex-grow bg-gray-200 overflow-auto p-8 relative">
                    <div id="printable-area" class="bg-white printable-shadow transition-all duration-300">
                        <div class="p-20 text-center animate-pulse">
                            <p class="font-black text-gray-400 uppercase tracking-[0.3em]">Synching Buffer...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const renderPreview = () => {
        const printableArea = document.getElementById('printable-area');
        if (!assessmentData) return;

        const user = getUser();
        const instructorName = user?.displayName || user?.user?.email || "Instructor";

        const html = buildPrintableHTML(assessmentData, {
            showAnswers,
            instructorName,
            layout: layoutConfig
        });

        printableArea.innerHTML = html;
        // Scroll to top
        printableArea.parentElement.scrollTop = 0;
    };

    const attachListeners = () => {
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const setting = btn.getAttribute('data-setting');
                const value = btn.getAttribute('data-value');

                layoutConfig[setting] = isNaN(value) ? value : value;
                if (setting === 'columns') layoutConfig[setting] = parseInt(value);

                // Redraw Sidebar Buttons
                document.querySelectorAll(`[data-setting="${setting}"]`).forEach(b => {
                    b.classList.remove('bg-black', 'text-white');
                    b.classList.add('bg-gray-50', 'text-gray-600');
                });
                btn.classList.add('bg-black', 'text-white');
                btn.classList.remove('bg-gray-50', 'text-gray-600');

                renderPreview();
            });
        });

        document.getElementById('print-now-btn').onclick = () => window.print();

        document.getElementById('download-pdf-btn').onclick = () => {
            const btn = document.getElementById('download-pdf-btn');
            const originalText = btn.textContent;
            const printableArea = document.getElementById('printable-area');

            btn.textContent = 'BUILDING...';
            btn.disabled = true;

            setTimeout(() => {
                try {
                    const filename = `${assessmentData.title.replace(/\s+/g, '_')}_${mode === 'student' ? 'Test' : 'Key'}.pdf`;
                    downloadPDF(printableArea, {
                        filename,
                        paperSize: layoutConfig.paperSize
                    });
                } catch (err) {
                    console.error(err);
                    alert("PDF Generation Failed.");
                } finally {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }, 1000); // 1s for full stabilization
        };
    };

    try {
        assessmentData = await getAssessmentWithKeys(id);
        renderPreview();
        attachListeners();
    } catch (error) {
        console.error(error);
        document.getElementById('printable-area').innerHTML = `
            <div class="p-20 text-center text-red-500 font-black uppercase tracking-widest">
                CRITICAL BUFFER ERROR: ${error.message}
            </div>
        `;
    }
};
