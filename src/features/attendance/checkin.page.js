import { getUser } from '../../core/store.js';
import { submitCheckin, getActiveSessionsForStudent } from '../../services/attendance.service.js';
import { requestGeolocation, getGeolocationErrorHelp } from '../../core/utils.js';

export const CheckinPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    let scanner = null;

    app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-emerald-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-green-500/10"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-md space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-7 rounded-[35px] border border-white/10 flex justify-between items-center shadow-xl">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-teal-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.3)] relative">
                                <div class="absolute inset-0 bg-green-400 rounded-xl md:rounded-2xl animate-pulse opacity-20 blur-lg"></div>
                                <svg class="w-6 h-6 md:w-7 md:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v0m6 0v0m6 0v0M5 16h2m10 0h2m-4-6h2m-4 0h2m-4 0h2m-4 0h2m-4 0h2m-8 8v2m0-10V4m0 0h2M5 4h2M5 4h2"></path></svg>
                            </div>
                            <div>
                                <h1 class="text-lg md:text-xl font-black text-white leading-tight tracking-tight uppercase">Check-in</h1>
                                <p class="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] opacity-80 mt-0.5">Mobile Registry</p>
                            </div>
                        </div>
                        <button onclick="location.hash='#student-dash'" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        </button>
                    </header>

                    <!-- Main Scanner Card -->
                    <main class="glass-panel p-8 md:p-10 rounded-[45px] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div class="relative z-10 flex flex-col items-center text-center space-y-10">
                            <div class="relative">
                                <div class="absolute inset-0 bg-emerald-500 blur-[40px] opacity-10 animate-pulse"></div>
                                <div class="w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-[40px] border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                                    <svg class="w-16 h-16 text-white/20 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v0m6 0v0m6 0v0M5 16h2m10 0h2m-4-6h2m-4 0h2m-4 0h2m-4 0h2m-4 0h2m-8 8v2m0-10V4m0 0h2M5 4h2M5 4h2"></path></svg>
                                </div>
                            </div>
                            
                            <div class="space-y-3">
                                <h3 class="text-2xl font-black text-white tracking-tight uppercase">Ready to Scan</h3>
                                <p class="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">Point your device at the terminal's dynamic code to verify attendance.</p>
                            </div>

                            <button id="open-scanner-btn" class="w-full bg-emerald-600 text-white p-6 rounded-[28px] font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] hover:shadow-[0_30px_50px_-12px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95 transition-all border border-white/20">Launch Scanner</button>
                        </div>
                    </main>

                    <div id="checkin-status" class="space-y-6"></div>

                    <!-- Active Sessions Tracker -->
                    <div id="active-sessions-container" class="space-y-4">
                        <div class="flex items-center gap-3 px-2">
                            <h2 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Live Hubs</h2>
                            <div class="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>
                        <div id="active-sessions-list" class="space-y-3">
                            <div class="glass-panel p-6 rounded-[30px] border border-white/5 opacity-30 text-center italic text-[10px] font-black uppercase tracking-widest text-white/40">Searching for broadcast signals...</div>
                        </div>
                    </div>
                </div>
            </div>
    </div>

    <!-- Fullscreen Scanner Overlay -->
    <div id="scanner-overlay" class="fixed inset-0 z-[60] bg-black animate-in fade-in duration-300 hidden flex-col items-center justify-center">
        <video id="qr-video" class="w-full h-full object-cover"></video>
        
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

        <!-- Scanner HUD -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="relative w-72 h-72">
                <!-- Corner Brackets -->
                <div class="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                <div class="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                <div class="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                <div class="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                
                <!-- Scanning Line -->
                <div class="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scan_2s_infinite] shadow-[0_0_15px_rgba(16,185,129,1)]"></div>
                
                <!-- HUD Text -->
                <div class="absolute -top-12 left-0 right-0 text-center">
                    <span class="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] animate-pulse">Scanning Signal...</span>
                </div>
            </div>
        </div>

        <!-- Controls -->
        <div class="absolute top-10 left-0 right-0 px-8 flex justify-between items-center">
            <h2 class="text-white font-black uppercase text-xs tracking-[0.3em] flex items-center gap-3">
                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                Terminal Sync
            </h2>
            <button id="close-scanner-btn" class="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="absolute bottom-12 left-0 right-0 px-10">
            <div class="glass-panel p-6 rounded-[30px] border border-white/10 backdrop-blur-2xl text-center space-y-2">
                <p class="text-white font-black text-sm uppercase tracking-tight">Align QR Code</p>
                <p class="text-white/40 text-[9px] font-black uppercase tracking-widest">Keep your device steady for rapid verification</p>
            </div>
        </div>
    </div>
    `;

    // Load active sessions for display
    try {
        const activeSessions = await getActiveSessionsForStudent(user.user.uid);
        const list = document.getElementById('active-sessions-list'); // Changed ID
        if (activeSessions.length === 0) {
            list.innerHTML = '<div class="glass-panel p-6 rounded-[30px] border border-white/5 opacity-30 text-center italic text-[10px] font-black uppercase tracking-widest text-white/40">Searching for broadcast signals...</div>';
            return;
        }

        list.innerHTML = activeSessions.map(s => `
            <div class="glass-panel p-5 rounded-[28px] border border-white/5 flex items-center justify-between group transition-all hover:border-emerald-500/30">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center ring-1 ring-white/5 group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <h5 class="text-xs font-black text-white uppercase tracking-tight">${s.className}</h5>
                        <p class="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mt-0.5">${s.teacherName}</p>
                    </div>
                </div>
                <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            </div>
        `).join('');
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
                const retryLocBtn = document.getElementById('retry-location-btn');
                if (retryLocBtn) retryLocBtn.addEventListener('click', () => {
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
            if (!navigator.onLine) {
                const err = new Error('OFFLINE_QUEUE');
                err.code = 'OFFLINE_QUEUE';
                throw err;
            }

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
            if (err.code === 'ALREADY_CHECKED_IN' && err.record) {
                showResult(statusDiv, true,
                    'Already Checked In',
                    `You successfully checked in at ${new Date(err.record.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}.`,
                    err.record.status
                );
            } else if (err.code === 'NOT_ENROLLED') {
                showResult(statusDiv, false, 'Access Denied', 'You are not enrolled in this roster. Please contact the instructor.');
            } else if (err.code === 'OFFLINE_QUEUE' || err.code === 'unavailable' || err.message.includes('fetch') || err.message.includes('network')) {
                // Offline Queuing implementation
                const queue = JSON.parse(localStorage.getItem('checkin_queue') || '[]');
                queue.push({
                    sessionId: payload.s,
                    userAuth: { uid: user.user.uid, name: user.displayName || user.email || 'Unknown', email: user.email || user.user.email || '' },
                    code: payload.c,
                    lat, lng,
                    timestamp: Date.now()
                });
                localStorage.setItem('checkin_queue', JSON.stringify(queue));

                showResult(statusDiv, true,
                    'Offline Mode: Queued',
                    'Your scan has been securely saved to this device and will automatically sync when network connection is restored.',
                    'PRESENT'
                );
            } else {
                showResult(statusDiv, false, 'Check-in Failed', err.message);
            }
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
            const retryLaunchBtn = document.getElementById('retry-launch-btn');
            if (retryLaunchBtn) retryLaunchBtn.addEventListener('click', () => {
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
;
};
