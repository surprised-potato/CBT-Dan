import { getUser } from '../../core/store.js';
import { submitCheckin, getActiveSessionsForStudent } from '../../services/attendance.service.js';
import { requestGeolocation, getGeolocationErrorHelp } from '../../core/utils.js';

export const CheckinPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    let scanner = null;

    app.innerHTML = `
    <div class="flex items-start justify-center min-h-screen bg-premium-gradient py-8 px-4 pb-32">
        <div class="bg-white w-full max-w-md rounded-[50px] shadow-2xl shadow-green-200/50 border border-white relative overflow-hidden">
            <div class="absolute top-0 right-0 w-96 h-96 bg-green-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>

            <header class="glass-panel sticky top-0 z-40 px-8 py-8 border-b border-gray-100 flex items-center gap-5">
                <button onclick="location.hash='#student-dash'" class="p-3 glass-panel rounded-2xl text-green-600 hover:text-green-800 transition-colors shadow-sm">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <div>
                    <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Cognita Check-in</h1>
                    <p class="text-[9px] font-black text-green-600 uppercase tracking-[0.3em] mt-0.5">Attendance Terminal</p>
                </div>
            </header>

            <main class="p-8 space-y-8 relative z-10 text-center">
                <!-- Launch Scanner -->
                <div class="py-12 flex flex-col items-center gap-6">
                    <div class="w-24 h-24 bg-green-50 rounded-[35px] flex items-center justify-center border-2 border-green-100 shadow-xl shadow-green-100/50">
                         <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9V5a2 2 0 012-2h4m0 16H5a2 2 0 01-2-2v-4m16 4v-4m0-6V5a2 2 0 00-2-2h-4m0 16h4a2 2 0 002-2"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Ready to Check-in?</h2>
                        <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 px-8">Point your camera at the teacher's QR code to mark your attendance.</p>
                    </div>
                    <button id="launch-scanner-btn" class="w-full bg-green-600 text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-green-200/50 hover:shadow-green-300 hover:-translate-y-1 active:scale-[0.98] transition-all">
                        Launch Scanner
                    </button>
                </div>

                <!-- Status Area -->
                <div id="checkin-status" class="hidden">
                </div>

                <!-- Active Sessions Info -->
                <div id="active-sessions" class="space-y-3 pt-8 border-t border-gray-50">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block text-left">Recent Activities</label>
                    <div id="sessions-list" class="space-y-2">
                        <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-center py-4">Syncing...</p>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Fullscreen Scanner Overlay -->
    <div id="scanner-overlay" class="fixed inset-0 bg-black z-[100] hidden flex-col items-center justify-center">
        <div id="scanner-region" class="w-full h-full"></div>
        
        <!-- Scanner HUD -->
        <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div class="w-64 h-64 border-2 border-white/50 rounded-[40px] relative">
                <div class="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl"></div>
                <div class="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl"></div>
                <div class="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl"></div>
                <div class="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl"></div>
            </div>
            <p class="text-white text-[10px] font-bold uppercase tracking-[0.4em] mt-12 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md text-center">Position QR Code in Frame</p>
        </div>

        <!-- Stop Button -->
        <button id="close-scanner-btn" class="absolute bottom-16 px-8 py-5 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             Close Camera
        </button>
    </div>
    `;

    // Load active sessions for display
    try {
        const activeSessions = await getActiveSessionsForStudent(user.user.uid);
        const list = document.getElementById('sessions-list');
        if (activeSessions.length === 0) {
            list.innerHTML = '<p class="text-[10px] font-black text-gray-200 uppercase tracking-widest italic text-center py-4">No active sessions for your classes</p>';
        } else {
            list.innerHTML = activeSessions.map(s => `
                <div class="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div class="text-left">
                        <p class="text-xs font-black text-gray-900">${s.className}</p>
                        <p class="text-[9px] font-bold text-gray-400">Started ${new Date(s.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                        <span class="text-[9px] font-black text-green-600 uppercase tracking-widest">Live</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Error loading active sessions:', e);
    }

    // ────────── QR Scanner Logic ──────────
    const handleScanSuccess = async (decodedText) => {
        // Stop scanner immediately and hide overlay
        await stopScanner();

        const statusDiv = document.getElementById('checkin-status');
        statusDiv.classList.remove('hidden');
        statusDiv.scrollIntoView({ behavior: 'smooth' });

        // Parse QR payload
        let payload;
        try {
            payload = JSON.parse(decodedText);
            if (!payload.s || !payload.c) throw new Error('Invalid QR format');
        } catch (e) {
            showResult(statusDiv, false, 'Invalid QR Code', 'Not a valid attendance QR code.');
            return;
        }

        // Show verifying state
        statusDiv.innerHTML = `
            <div class="flex flex-col items-center py-8">
                <div class="w-12 h-1 bg-green-500 rounded-full animate-pulse mb-4"></div>
                <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] animate-pulse">Verifying Location...</p>
            </div>`;

        // Get geolocation with hardened error handling
        let position;
        try {
            position = await requestGeolocation(true, 15000);
        } catch (geoErr) {
            // Retry once with relaxed accuracy
            try {
                position = await requestGeolocation(false, 20000);
            } catch (retryErr) {
                const help = getGeolocationErrorHelp(retryErr);
                statusDiv.innerHTML = `
                    <div class="flex flex-col items-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div class="w-20 h-20 bg-amber-50 border border-amber-100 rounded-[28px] flex items-center justify-center mb-6">
                            <svg class="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                        <h2 class="text-lg font-black text-amber-600 uppercase tracking-tight mb-3 text-center">${help.title}</h2>
                        <div class="text-[11px] font-bold text-gray-600 text-center leading-relaxed mb-6 max-w-xs px-4">${help.message}</div>
                        <button id="retry-location-btn" class="w-full bg-amber-500 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all">Retry Location</button>
                    </div>`;
                document.getElementById('retry-location-btn')?.addEventListener('click', () => {
                    statusDiv.classList.add('hidden');
                    statusDiv.innerHTML = '';
                    handleScanSuccess(decodedText); // re-run with same payload
                });
                return;
            }
        }

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Submit check-in
        statusDiv.innerHTML = `
            <div class="flex flex-col items-center py-8">
                <div class="w-12 h-1 bg-green-500 rounded-full animate-pulse mb-4"></div>
                <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] animate-pulse">Confirming Attendance...</p>
            </div>`;

        try {
            const record = await submitCheckin(
                payload.s,
                {
                    uid: user.user.uid,
                    name: user.displayName || user.email || 'Unknown',
                    email: user.email || user.user.email || ''
                },
                payload.c,
                lat,
                lng
            );

            showResult(statusDiv, true,
                record.status === 'LATE' ? 'Checked In — LATE' : 'Checked In — PRESENT',
                `Attendance confirmed at ${new Date(record.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
                record.status
            );
        } catch (err) {
            showResult(statusDiv, false, 'Check-in Failed', err.message);
        }
    };

    const showResult = (container, success, title, message, status) => {
        const isLate = status === 'LATE';
        container.innerHTML = `
            <div class="flex flex-col items-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="w-20 h-20 ${success ? (isLate ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100') : 'bg-red-50 border-red-100'} rounded-[28px] flex items-center justify-center mb-6 border">
                    ${success
                ? '<svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                : '<svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
            }
                </div>
                <h2 class="text-xl font-black ${success ? (isLate ? 'text-amber-600' : 'text-green-600') : 'text-red-600'} uppercase tracking-tight mb-2 text-center">${title}</h2>
                <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-relaxed">${message}</p>
                ${success ? `
                    <button onclick="location.hash='#student-dash'" class="mt-8 w-full bg-green-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all">Return to Dashboard</button>
                ` : `
                    <button id="retry-launch-btn" class="mt-8 w-full bg-gray-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all">Try Scanning Again</button>
                `}
            </div>`;

        if (!success) {
            document.getElementById('retry-launch-btn')?.addEventListener('click', () => {
                container.classList.add('hidden');
                container.innerHTML = '';
                startScanner();
            });
        }
    };

    const startScanner = async () => {
        document.getElementById('scanner-overlay').classList.remove('hidden');
        document.getElementById('scanner-overlay').classList.add('flex');

        scanner = new Html5Qrcode('scanner-region');
        try {
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 15, qrbox: { width: 250, height: 250 } },
                handleScanSuccess,
                () => { } // ignore scan failures
            );
        } catch (err) {
            console.error('Scanner start error:', err);
            await stopScanner();
            const statusDiv = document.getElementById('checkin-status');
            statusDiv.classList.remove('hidden');
            showResult(statusDiv, false, 'Camera Access Error', 'Could not open camera. Please check your browser permissions.');
        }
    };

    const stopScanner = async () => {
        if (scanner) {
            try { await scanner.stop(); } catch (e) { }
            scanner = null;
        }
        document.getElementById('scanner-overlay').classList.add('hidden');
        document.getElementById('scanner-overlay').classList.remove('flex');
    };

    // --- UI Listeners ---
    document.getElementById('launch-scanner-btn').onclick = startScanner;
    document.getElementById('close-scanner-btn').onclick = stopScanner;

    // Cleanup on navigation
    window.addEventListener('hashchange', () => {
        stopScanner();
    }, { once: true });
};
