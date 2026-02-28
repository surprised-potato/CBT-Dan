import { getUser } from '../../core/store.js';
import { getClassesByTeacher } from '../../services/class.service.js';
import {
    startSession,
    rotateCode,
    closeSession,
    listenToSession,
    getSessionsByClass,
    exportAttendanceCSV,
    getActiveSessionsByTeacher
} from '../../services/attendance.service.js';

export const AttendanceTerminalPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    const classes = await getClassesByTeacher(user.user.uid);

    // ────────── State ──────────
    let activeSession = null;
    let rotateInterval = null;
    let autoCloseTimeout = null;
    let unsubscribe = null;
    let currentGeofence = { lat: null, lng: null };
    let map = null;
    let marker = null;
    let circle = null;

    // ────────── Setup View ──────────
    const renderSetup = () => {
        app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-emerald-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-green-500/10 animate-[mesh-float_25s_infinite_alternate]"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-7 rounded-[35px] border border-white/10 flex justify-between items-center shadow-xl">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.3)] relative">
                                <div class="absolute inset-0 bg-green-400 rounded-xl md:rounded-2xl animate-pulse opacity-20 blur-lg"></div>
                                <svg class="w-6 h-6 md:w-7 md:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v0m6 0v0m6 0v0M5 16h2m10 0h2m-4-6h2m-4 0h2m-4 0h2m-4 0h2m-8 8v2m0-10V4m0 0h2M5 4h2M5 4h2"></path></svg>
                            </div>
                            <div>
                                <h1 class="text-lg md:text-xl font-black text-white leading-tight tracking-tight uppercase">Terminal</h1>
                                <p class="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] opacity-80 mt-0.5">Dynamic Attendance</p>
                            </div>
                        </div>
                        <button onclick="location.hash='#teacher-dash'" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        </button>
                    </header>

                    <!-- Class Selection -->
                    <div class="glass-panel p-6 md:p-8 rounded-[35px] border border-white/10 space-y-6 shadow-xl">
                        <label class="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] block">Select Class</label>
                        <select id="att-class" class="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/10 focus:border-emerald-500 outline-none transition-all font-bold text-white/80 appearance-none shadow-inner">
                            <option value="">— SELECT CLASS —</option>
                            ${classes.map(c => `<option value="${c.id}" data-name="${c.name} [${c.section}]" data-students="${(c.students || []).length}">${c.name} [${c.section}] (${(c.students || []).length} students)</option>`).join('')}
                        </select>
                    </div>

                    <!-- Session Config -->
                    <div class="glass-panel p-6 md:p-8 rounded-[35px] border border-white/10 space-y-6 shadow-xl">
                        <label class="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] block">Session Settings</label>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <label class="text-[9px] font-black text-white/50 uppercase tracking-widest">Late After (min)</label>
                                <input type="number" id="late-threshold" value="15" min="0" class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center font-black text-white/80 focus:border-emerald-400 outline-none shadow-inner">
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-[9px] font-black text-white/50 uppercase tracking-widest">Auto Close (min)</label>
                                <input type="number" id="auto-close" value="0" min="0" placeholder="0 = manual" class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center font-black text-white/80 focus:border-emerald-400 outline-none shadow-inner placeholder:opacity-30">
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] font-black text-white/50 uppercase tracking-widest">Session Note (Optional)</label>
                            <input type="text" id="session-note" placeholder="e.g. Lab class, Room 302" class="p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white/80 focus:border-emerald-400 outline-none shadow-inner placeholder:opacity-30">
                        </div>
                    </div>

                    <!-- Geofence -->
                    <div class="glass-panel p-6 md:p-8 rounded-[35px] border border-white/10 space-y-6 shadow-xl">
                        <label class="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] block">Location Perimeter</label>
                        <div class="flex flex-wrap items-end gap-4">
                            <button type="button" id="capture-loc-btn" class="bg-emerald-600/10 text-emerald-400 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/20 border border-emerald-500/20 transition-colors flex items-center gap-2 shadow-lg">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Use Current Location
                            </button>
                            <div class="flex items-center gap-2">
                                <label class="text-[9px] font-black text-white/50 uppercase tracking-widest">Radius</label>
                                <input type="number" id="geo-radius" value="100" min="10" step="10" class="w-20 p-2 text-center bg-white/5 border border-white/10 rounded-xl font-black text-emerald-400 focus:border-emerald-500 outline-none text-sm shadow-inner">
                                <span class="text-[9px] font-black text-white/40 uppercase">M</span>
                            </div>
                        </div>
                        <div id="att-map" class="w-full h-[300px] md:h-[400px] rounded-2xl border-2 border-white/10 overflow-hidden relative z-0 shadow-inner"></div>
                        <div class="text-[8px] font-black text-emerald-400 uppercase tracking-widest text-center" id="att-coords">LAT: -- | LNG: --</div>
                    </div>

                    <div id="setup-error" class="text-red-400 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-900/20 py-4 rounded-2xl border border-red-800/50 shadow-lg"></div>

                    <button id="start-session-btn" class="w-full bg-emerald-600 text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-[0.98] transition-all">
                        Start Broadcasting
                    </button>
                </div>
            </div>
        </div>`;

        // Init map
        setTimeout(() => {
            const mapDiv = document.getElementById('att-map');
            if (!mapDiv) return;
            map = L.map('att-map').setView([14.5995, 120.9842], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OSM', maxZoom: 19
            }).addTo(map);
            map.on('click', (e) => updateMapUI(e.latlng.lat, e.latlng.lng, parseInt(document.getElementById('geo-radius').value) || 100));
        }, 100);

        // Auto-capture location
        document.getElementById('capture-loc-btn').onclick = () => {
            if (!navigator.geolocation) return alert('Geolocation not supported.');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    updateMapUI(pos.coords.latitude, pos.coords.longitude, parseInt(document.getElementById('geo-radius').value) || 100);
                    map.setView([pos.coords.latitude, pos.coords.longitude], 16);
                },
                () => alert('Location access denied.'),
                { enableHighAccuracy: true }
            );
        };

        document.getElementById('geo-radius').onchange = (e) => {
            if (currentGeofence.lat) updateMapUI(currentGeofence.lat, currentGeofence.lng, parseInt(e.target.value) || 100);
        };

        // Start session
        document.getElementById('start-session-btn').onclick = async () => {
            const classSelect = document.getElementById('att-class');
            const err = document.getElementById('setup-error');
            err.classList.add('hidden');

            if (!classSelect.value) { err.textContent = 'SELECT A CLASS'; err.classList.remove('hidden'); return; }
            if (!currentGeofence.lat) { err.textContent = 'SET GEOFENCE LOCATION'; err.classList.remove('hidden'); return; }

            const btn = document.getElementById('start-session-btn');
            btn.disabled = true;
            btn.textContent = 'INITIALISING...';

            try {
                const selectedOption = classSelect.options[classSelect.selectedIndex];
                const session = await startSession({
                    classId: classSelect.value,
                    className: selectedOption.dataset.name,
                    teacherId: user.user.uid,
                    geofence: {
                        lat: currentGeofence.lat,
                        lng: currentGeofence.lng,
                        radius: parseInt(document.getElementById('geo-radius').value) || 100
                    },
                    lateThresholdMinutes: parseInt(document.getElementById('late-threshold').value) || 0,
                    autoCloseMinutes: parseInt(document.getElementById('auto-close').value) || 0,
                    note: document.getElementById('session-note').value.trim()
                });
                activeSession = session;
                renderTerminal();
            } catch (e) {
                err.textContent = e.message.toUpperCase();
                err.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'Start Broadcasting';
            }
        };
    };

    // ────────── Map Helpers ──────────
    const updateMapUI = (lat, lng, radius) => {
        document.getElementById('att-coords').innerText = `LAT: ${lat.toFixed(5)} | LNG: ${lng.toFixed(5)}`;
        currentGeofence = { lat, lng };
        if (!marker) {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on('dragend', () => {
                const p = marker.getLatLng();
                updateMapUI(p.lat, p.lng, parseInt(document.getElementById('geo-radius').value) || 100);
            });
        } else { marker.setLatLng([lat, lng]); }
        if (!circle) {
            circle = L.circle([lat, lng], { color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.15, radius }).addTo(map);
        } else { circle.setLatLng([lat, lng]); circle.setRadius(radius); }
    };

    // ────────── Terminal View (Live QR) ──────────
    const renderTerminal = () => {
        const classId = activeSession.classId;

        app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-emerald-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-green-500/10 animate-[mesh-float_25s_infinite_alternate]"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-7 rounded-[35px] border border-white/10 flex justify-between items-center shadow-xl">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.3)] relative">
                                <div class="absolute inset-0 bg-green-400 rounded-xl md:rounded-2xl animate-pulse opacity-20 blur-lg"></div>
                                <svg class="w-6 h-6 md:w-7 md:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v0m6 0v0m6 0v0M5 16h2m10 0h2m-4-6h2m-4 0h2m-4 0h2m-4 0h2m-8 8v2m0-10V4m0 0h2M5 4h2M5 4h2"></path></svg>
                            </div>
                            <div>
                                <h1 class="text-lg md:text-xl font-black text-white leading-tight tracking-tight uppercase">${activeSession.className}</h1>
                                <p class="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] opacity-80 mt-0.5">Live Session</p>
                            </div>
                        </div>
                        <button onclick="location.hash='#teacher-dash'" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        </button>
                    </header>

                    ${activeSession.note ? `<div class="glass-panel p-4 rounded-2xl border border-white/10 text-center shadow-xl"><span class="text-[9px] font-black text-white/50 uppercase tracking-widest">${activeSession.note}</span></div>` : ''}

                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <!-- QR Display Panel -->
                        <div class="lg:col-span-3 space-y-8">
                            <div class="glass-panel p-10 md:p-14 rounded-[50px] border border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <div class="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div class="relative mb-12">
                                    <div class="absolute inset-0 scale-125 bg-white blur-[60px] opacity-10 animate-pulse"></div>
                                    <div id="qr-container" class="bg-white p-10 rounded-[45px] shadow-[0_40px_80px_rgba(255,255,255,0.1)] relative z-10 transform transition-transform group-hover:scale-[1.02]">
                                        <canvas id="qr-canvas"></canvas>
                                    </div>
                                    <div id="qr-timer" class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 px-6 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-xl ring-2 ring-white/20 whitespace-nowrap">Rotates in 30s</div>
                                </div>
                                
                                <div class="space-y-4 relative z-10 w-full">
                                    <h3 id="terminal-status" class="text-3xl font-black text-white tracking-tighter uppercase leading-none">Broadcasting Mode</h3>
                                    <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                        Identity Verification Active
                                    </p>
                                    <div id="csv-export-btn-container" class="pt-6">
                                        <button id="export-csv-btn" class="bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Download Log (.csv)</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Live Feed Panel -->
                        <div class="lg:col-span-2 flex flex-col h-full space-y-6">
                            <div class="glass-panel rounded-[40px] border border-white/5 flex flex-col flex-1 shadow-xl overflow-hidden">
                                <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <h2 class="text-[10px] font-black text-white uppercase tracking-[0.4em]">Live Roll Call Grid</h2>
                                    <span id="checkin-count" class="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg shadow-emerald-900/20">0 Connected</span>
                                </div>
                                <div id="checkins-feed" class="flex-1 overflow-y-auto p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 custom-scrollbar min-h-[400px] content-start">
                                    <div class="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 italic font-medium text-xs text-white uppercase tracking-widest">
                                        <svg class="w-12 h-12 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                                        Awaiting Initial Signals...
                                    </div>
                                </div>
                            </div>
                            
                            <button id="end-session-btn" class="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 p-6 rounded-[30px] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl active:scale-95">Decommission Terminal</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        // Start code rotation
        let currentCode = activeSession.currentCode;
        const renderQR = (code) => {
            const canvas = document.getElementById('qr-canvas');
            const qrlib = window.QRCode || QRCode;
            if (!canvas || !qrlib) {
                console.error('QR Library or Canvas not found');
                return;
            }
            const payload = JSON.stringify({ s: activeSession.id, c: code });
            qrlib.toCanvas(canvas, payload, { width: 256, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } }, (error) => {
                if (error) console.error('QR Render Error:', error);
            });
            const display = document.getElementById('current-code-display');
            if (display) display.textContent = code;
        };
        renderQR(currentCode);

        rotateInterval = setInterval(async () => {
            try {
                currentCode = await rotateCode(activeSession.id);
                renderQR(currentCode);
            } catch (e) { console.error('Rotate error:', e); }
        }, 5000);

        // Auto-close timer
        if (activeSession.autoCloseMinutes > 0) {
            autoCloseTimeout = setTimeout(() => {
                handleClose();
            }, activeSession.autoCloseMinutes * 60000);
        }

        // Real-time listener
        unsubscribe = listenToSession(activeSession.id, (session) => {
            const feed = document.getElementById('live-feed');
            const count = document.getElementById('checkin-count');
            if (!feed || !count) return;

            const checkedIn = session.checkedIn || [];
            count.textContent = checkedIn.length;

            if (checkedIn.length === 0) {
                feed.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 italic font-medium text-xs text-white uppercase tracking-widest"><svg class="w-12 h-12 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>Awaiting Initial Signals...</div>';
                return;
            }

            const renderFeedRow = (c) => {
                const isLate = c.status === 'LATE';
                const initial = (c.name && c.name !== 'Unknown') ? c.name.charAt(0) : (c.email ? c.email.charAt(0) : '?');
                return `
            <div title="${c.name || c.email} - ${new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}" class="flex flex-col items-center gap-2 group animate-in zoom-in-50 duration-500">
                <div class="relative">
                    <div class="w-14 h-14 md:w-16 md:h-16 ${isLate ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'} rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-110">
                        <span class="text-xl md:text-2xl font-black uppercase">${initial.toUpperCase()}</span>
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-5 h-5 ${isLate ? 'bg-amber-500' : 'bg-emerald-500'} border-2 border-[#020617] rounded-full flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="${isLate ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' : 'M5 13l4 4L19 7'}"></path></svg>
                    </div>
                </div>
                <p class="text-[10px] font-black text-white/70 tracking-tighter uppercase w-16 truncate text-center">${c.name || c.email.split('@')[0]}</p>
            </div>
        `;
            };
            feed.innerHTML = checkedIn.slice().reverse().map(s => renderFeedRow(s)).join('');
        });

        // Close session handler
        const handleClose = async () => {
            if (rotateInterval) clearInterval(rotateInterval);
            if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
            if (unsubscribe) unsubscribe();
            try {
                await closeSession(activeSession.id);
            } catch (e) { console.error('Close error:', e); }
            activeSession = null;
            renderSetup();
        };

        document.getElementById('close-session-btn').onclick = async () => {
            if (confirm('END THIS ATTENDANCE SESSION?')) handleClose();
        };

        // CSV Export
        document.getElementById('export-csv-btn').onclick = async () => {
            try {
                const cls = classes.find(c => c.id === classId);
                await exportAttendanceCSV(classId, cls);
            } catch (e) {
                alert(e.message);
            }
        };
    };

    // Cleanup on navigation
    window.addEventListener('hashchange', () => {
        if (rotateInterval) clearInterval(rotateInterval);
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
        if (unsubscribe) unsubscribe();
    }, { once: true });

    // --- Initial Entry Logic ---
    const checkActiveSessions = async () => {
        app.innerHTML = `
                    < div class="flex items-center justify-center min-h-screen bg-premium-gradient" >
            <div class="w-16 h-1 bg-green-500 rounded-full animate-pulse mb-8"></div>
            <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Syncing Active Sessions...</p>
        </div > `;

        try {
            const activeSessions = await getActiveSessionsByTeacher(user.user.uid);
            if (activeSessions.length > 0) {
                // If multiple, pick the most recent
                activeSession = activeSessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                renderTerminal();
            } else {
                renderSetup();
            }
        } catch (e) {
            console.error('Session recovery error:', e);
            renderSetup();
        }
    };

    checkActiveSessions();
};
