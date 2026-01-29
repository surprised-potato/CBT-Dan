import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';

export const UITestPage = () => {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="p-12 space-y-12 max-w-2xl mx-auto pb-32">
            <header>
                <div class="w-16 h-1 bg-blue-premium rounded-full mb-6"></div>
                <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">UI Telemetry Deck</h1>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-2">Surface validation of component schemas</p>
            </header>

            <section class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-50/50 border border-white space-y-8">
                <h2 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-4">Button Protocols</h2>
                <div class="grid grid-cols-1 gap-4">
                    ${renderButton({ text: 'Primary Operational', variant: 'primary', id: 'btn-primary' })}
                    ${renderButton({ text: 'Secondary Protocol', variant: 'secondary', id: 'btn-secondary' })}
                    ${renderButton({ text: 'Termination Protocol', variant: 'danger', id: 'btn-danger' })}
                </div>
            </section>

            <section class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-50/50 border border-white space-y-8">
                <h2 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-4">Data Entry Vectors</h2>
                <div class="space-y-6">
                    ${renderInput({ id: 'input-text', label: 'Registry Key', placeholder: 'USER-ARCHIVE-01', type: 'text' })}
                    ${renderInput({ id: 'input-pass', label: 'Security Key', type: 'password', placeholder: '••••••••' })}
                </div>
            </section>

            <section class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-50/50 border border-white space-y-8">
                <h2 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-4">Streaming States</h2>
                <div class="flex justify-center p-12 bg-gray-50 rounded-[40px] shadow-inner border border-gray-100">
                    <div class="flex flex-col items-center gap-6">
                         <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                         <p class="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] animate-pulse">Syncing Telemetry...</p>
                    </div>
                </div>
            </section>

            <div class="pt-12 text-center">
                 <button onclick="location.hash='#login'" class="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] hover:text-blue-600 transition-all border-b-2 border-transparent hover:border-blue-600 pb-1">Return to Security Gateway</button>
            </div>
        </div>
    `;
};
