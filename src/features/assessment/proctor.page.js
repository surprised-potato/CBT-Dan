import { getUser } from '../../core/store.js';
import { getAssessment } from '../../services/assessment.service.js';

export const ProctorPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user || user.role !== 'teacher') {
        window.location.hash = '#login';
        return;
    }

    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) {
        app.innerHTML = '<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">Missing Assessment ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center">
            <div class="w-16 h-1 bg-purple-premium rounded-full animate-pulse mb-8"></div>
            <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Loading Proctor Session...</p>
        </div>
    `;

    try {
        const assessment = await getAssessment(id);
        const unlockPassword = (assessment.settings && assessment.settings.unlockPassword) || (assessment.settings && assessment.settings.proctorPassword) || 'N/A';

        // Build the exam URL that students will scan
        const examUrl = `${window.location.origin}${window.location.pathname}#exam?id=${id}`;

        app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-teal-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-cyan-500/10 animate-[mesh-float_25s_infinite_alternate]"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-7 rounded-[35px] border border-white/10 flex justify-between items-center shadow-xl">
                        <div class="flex items-center gap-4">
                            <button onclick="location.hash='#details?id=${id}'" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-teal-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div>
                                <h1 class="text-lg md:text-xl font-black text-white leading-tight tracking-tight uppercase">Proctor Mode</h1>
                                <p class="text-[10px] text-teal-400 font-black uppercase tracking-[0.3em] opacity-80 mt-0.5">Assessment Distribution</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full ${assessment.status === 'active' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-amber-500'}"></span>
                            <span class="text-[10px] font-black uppercase tracking-widest ${assessment.status === 'active' ? 'text-green-400' : 'text-amber-400'}">${assessment.status === 'active' ? 'Live' : 'Draft'}</span>
                        </div>
                    </header>

                    <!-- Assessment Title Card -->
                    <div class="glass-panel p-6 md:p-8 rounded-[35px] border border-white/10 shadow-xl text-center relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                        <h2 class="text-2xl md:text-3xl font-black text-white uppercase tracking-tight relative z-10 mb-2">${assessment.title}</h2>
                        <p class="text-[10px] font-black text-teal-400/60 uppercase tracking-[0.3em] relative z-10">${assessment.questionCount} Items • ${(assessment.settings && assessment.settings.timeLimit) ? assessment.settings.timeLimit + ' Min' : 'No Time Limit'}</p>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <!-- QR Code Display -->
                        <div class="lg:col-span-3 space-y-8">
                            <div class="glass-panel p-10 md:p-14 rounded-[50px] border border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <div class="absolute inset-0 bg-gradient-to-br from-teal-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div class="relative mb-12">
                                    <div class="absolute inset-0 scale-125 bg-white blur-[60px] opacity-10 animate-pulse"></div>
                                    <div id="qr-container" class="bg-white p-10 rounded-[45px] shadow-[0_40px_80px_rgba(255,255,255,0.1)] relative z-10 transform transition-transform group-hover:scale-[1.02]">
                                        <canvas id="qr-canvas"></canvas>
                                    </div>
                                    <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-teal-600 px-6 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-xl ring-2 ring-white/20 whitespace-nowrap flex items-center gap-2">
                                        <span class="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                                        Scan to Access Exam
                                    </div>
                                </div>
                                
                                <div class="space-y-4 relative z-10 w-full">
                                    <h3 class="text-3xl font-black text-white tracking-tighter uppercase leading-none">Broadcasting</h3>
                                    <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                        <span class="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span>
                                        Students can scan to access the test
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Controls Panel -->
                        <div class="lg:col-span-2 flex flex-col h-full space-y-6">
                            <!-- Unlock Password Card -->
                            <div class="glass-panel rounded-[40px] border border-white/5 shadow-xl overflow-hidden">
                                <div class="p-8 border-b border-white/5 bg-white/5">
                                    <h2 class="text-[10px] font-black text-white uppercase tracking-[0.4em]">Proctor Controls</h2>
                                </div>
                                <div class="p-8 space-y-6">
                                    <div>
                                        <p class="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">Unlock Password</p>
                                        <p class="text-[10px] font-bold text-white/30 leading-relaxed mb-4">Use this password to unlock a student's exam if they trigger the anti-cheat lockout.</p>
                                        <button id="reveal-pwd-btn" class="w-full bg-teal-500/10 text-teal-400 p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-teal-500/20 hover:bg-teal-500/20 transition-all flex items-center justify-center gap-3 shadow-lg">
                                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            Reveal Password
                                        </button>
                                    </div>

                                    <div class="h-px bg-white/5"></div>

                                    <div>
                                        <p class="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">Exam URL</p>
                                        <div class="flex gap-2">
                                            <input type="text" readonly value="${examUrl}" class="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-white/40 outline-none truncate">
                                            <button id="copy-url-btn" class="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-teal-400 hover:bg-white/10 transition-all" title="Copy URL">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quick Actions -->
                            <button onclick="window.location.hash='#details?id=${id}'" class="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 p-6 rounded-[30px] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl active:scale-95">
                                Back to Assessment Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Password Reveal Modal -->
        <div id="pwd-modal" class="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] hidden items-center justify-center p-6">
            <div class="glass-panel bg-[#0f172a]/95 p-10 md:p-12 rounded-[50px] border border-white/10 max-w-sm w-full text-center relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
                <div class="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                <div class="relative z-10">
                    <div class="w-20 h-20 bg-teal-500/10 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                        <svg class="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                    </div>
                    <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Unlock Password</h3>
                    <p class="text-[10px] font-black text-white/30 uppercase tracking-widest mb-8">For Proctor Override Only</p>
                    <div class="bg-black/40 p-8 rounded-3xl border border-white/10 mb-8 shadow-inner">
                        <p class="text-4xl font-black text-teal-400 tracking-[0.6em] font-mono drop-shadow-[0_0_15px_rgba(20,184,166,0.6)]">${unlockPassword}</p>
                    </div>
                    <button id="close-pwd-modal" class="w-full p-5 rounded-3xl bg-white/5 border border-white/10 font-black uppercase text-[10px] tracking-[0.2em] text-white/40 hover:bg-white/10 hover:text-white transition-all">Close</button>
                </div>
            </div>
        </div>
        `;

        // --- Render QR Code ---
        const renderQR = () => {
            const canvas = document.getElementById('qr-canvas');
            const qrlib = window.QRCode || QRCode;
            if (!canvas || !qrlib) return;
            qrlib.toCanvas(canvas, examUrl, {
                width: 280,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' }
            }, (error) => {
                if (error) console.error('QR Render Error:', error);
            });
        };
        renderQR();

        // Refresh QR visual periodically (same URL, just re-render for visual dynamism)
        const qrInterval = setInterval(renderQR, 10000);

        // --- Password Modal ---
        document.getElementById('reveal-pwd-btn').onclick = () => {
            const modal = document.getElementById('pwd-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        };

        document.getElementById('close-pwd-modal').onclick = () => {
            const modal = document.getElementById('pwd-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        };

        document.getElementById('pwd-modal').onclick = (e) => {
            if (e.target.id === 'pwd-modal') {
                e.target.classList.add('hidden');
                e.target.classList.remove('flex');
            }
        };

        // --- Copy URL ---
        document.getElementById('copy-url-btn').onclick = async () => {
            try {
                await navigator.clipboard.writeText(examUrl);
                const btn = document.getElementById('copy-url-btn');
                btn.innerHTML = '<svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                setTimeout(() => {
                    btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
                }, 2000);
            } catch (e) {
                // Fallback: select the input text
                const input = document.querySelector('input[readonly]');
                input.select();
            }
        };

        // Cleanup on navigation
        window.addEventListener('hashchange', () => {
            clearInterval(qrInterval);
        }, { once: true });

    } catch (error) {
        console.error('Proctor page error:', error);
        app.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">CRITICAL ERROR: ${error.message}</div>`;
    }
};
