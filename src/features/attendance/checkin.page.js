import { getUser } from '../../core/store.js';
import { submitCheckin, getActiveSessionsForStudent } from '../../services/attendance.service.js';

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
                    <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Check In</h1>
                    <p class="text-[9px] font-black text-green-600 uppercase tracking-[0.3em] mt-0.5">Attendance Scanner</p>
                </div>
            </header>

            <main class="p-8 space-y-8 relative z-10">
                <!-- Scanner -->
                <div class="space-y-4">
                    <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] block">Point Camera at QR Code</label>
                    <div id="scanner-region" class="w-full aspect-square rounded-3xl overflow-hidden border-2 border-green-200 bg-gray-900 relative">
                        <div id="scanner-placeholder" class="absolute inset-0 flex flex-col items-center justify-center">
                            <svg class="w-16 h-16 text-green-400 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9V5a2 2 0 012-2h4m0 16H5a2 2 0 01-2-2v-4m16 4v-4m0-6V5a2 2 0 00-2-2h-4m0 16h4a2 2 0 002-2"></path></svg>
                            <p class="text-[10px] font-black text-green-400/70 uppercase tracking-widest animate-pulse">Initialising Camera...</p>
                        </div>
                    </div>
                </div>

                <!-- Status Area -->
                <div id="checkin-status" class="hidden">
                </div>

                <!-- Active Sessions Info -->
                <div id="active-sessions" class="space-y-3">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block">Active Sessions</label>
                    <div id="sessions-list" class="space-y-2">
                        <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-center py-4">Checking...</p>
                    </div>
                </div>
            </main>
        </div>
    </div>`;

    // Load active sessions for display
    try {
        const activeSessions = await getActiveSessionsForStudent(user.user.uid);
        const list = document.getElementById('sessions-list');
        if (activeSessions.length === 0) {
            list.innerHTML = '<p class="text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-center py-4">No active sessions for your classes</p>';
        } else {
            list.innerHTML = activeSessions.map(s => `
                <div class="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                    <div>
                        <p class="text-xs font-black text-gray-900">${s.className}</p>
                        <p class="text-[9px] font-bold text-gray-400">Started ${new Date(s.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span class="text-[9px] font-black text-green-600 uppercase tracking-widest">Active</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Error loading active sessions:', e);
    }

    // ────────── QR Scanner ──────────
    const handleScanSuccess = async (decodedText) => {
        // Stop scanner immediately
        if (scanner) {
            try { await scanner.stop(); } catch (e) { }
        }

        const statusDiv = document.getElementById('checkin-status');
        statusDiv.classList.remove('hidden');

        // Parse QR payload
        let payload;
        try {
            payload = JSON.parse(decodedText);
            if (!payload.s || !payload.c) throw new Error('Invalid QR format');
        } catch (e) {
            showResult(statusDiv, false, 'Invalid QR Code', 'Not a valid attendance QR code.');
            restartScanner();
            return;
        }

        // Show verifying state
        statusDiv.innerHTML = `
            <div class="flex flex-col items-center py-8">
                <div class="w-12 h-1 bg-green-500 rounded-full animate-pulse mb-4"></div>
                <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] animate-pulse">Verifying Location...</p>
            </div>`;

        // Get geolocation
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Submit check-in
            statusDiv.innerHTML = `
                <div class="flex flex-col items-center py-8">
                    <div class="w-12 h-1 bg-green-500 rounded-full animate-pulse mb-4"></div>
                    <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] animate-pulse">Confirming Attendance...</p>
                </div>`;

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
            restartScanner();
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
                <h2 class="text-xl font-black ${success ? (isLate ? 'text-amber-600' : 'text-green-600') : 'text-red-600'} uppercase tracking-tight mb-2">${title}</h2>
                <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-relaxed">${message}</p>
                ${success ? `
                    <button onclick="location.hash='#student-dash'" class="mt-8 w-full bg-green-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all">Return to Dashboard</button>
                ` : `
                    <button id="retry-scan-btn" class="mt-8 w-full bg-gray-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all">Try Again</button>
                `}
            </div>`;

        if (!success) {
            document.getElementById('retry-scan-btn')?.addEventListener('click', () => {
                container.classList.add('hidden');
                container.innerHTML = '';
                startScanner();
            });
        }
    };

    const startScanner = () => {
        const placeholder = document.getElementById('scanner-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        scanner = new Html5Qrcode('scanner-region');
        scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 200, height: 200 } },
            handleScanSuccess,
            () => { } // ignore scan failures (no code found yet)
        ).catch(err => {
            console.error('Scanner start error:', err);
            const statusDiv = document.getElementById('checkin-status');
            statusDiv.classList.remove('hidden');
            showResult(statusDiv, false, 'Camera Error', 'Could not access camera. Please check permissions.');
        });
    };

    const restartScanner = () => {
        setTimeout(() => startScanner(), 3000);
    };

    // Cleanup on navigation
    window.addEventListener('hashchange', () => {
        if (scanner) {
            try { scanner.stop(); } catch (e) { }
        }
    }, { once: true });

    // Start scanner
    startScanner();
};
