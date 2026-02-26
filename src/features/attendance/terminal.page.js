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
        <div class="flex items-start justify-center min-h-screen bg-premium-gradient py-8 px-4 pb-32">
            <div class="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl shadow-purple-200/50 border border-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-96 h-96 bg-green-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>

                <header class="glass-panel sticky top-0 z-40 px-8 py-8 border-b border-gray-100 flex justify-between items-center">
                    <div class="flex items-center gap-5">
                        <button onclick="location.hash='#teacher-dash'" class="p-3 glass-panel rounded-2xl text-green-600 hover:text-green-800 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Attendance Terminal</h1>
                            <p class="text-[9px] font-black text-green-600 uppercase tracking-[0.3em] mt-0.5">Configure & Broadcast</p>
                        </div>
                    </div>
                </header>

                <main class="p-8 space-y-8 relative z-10">
                    <!-- Class Selection -->
                    <div class="bg-white p-8 rounded-[40px] shadow-xl shadow-green-50/50 border border-white space-y-6">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] block">Select Class</label>
                        <select id="att-class" class="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                            <option value="">— SELECT CLASS —</option>
                            ${classes.map(c => `<option value="${c.id}" data-name="${c.name} [${c.section}]" data-students="${(c.students || []).length}">${c.name} [${c.section}] (${(c.students || []).length} students)</option>`).join('')}
                        </select>
                    </div>

                    <!-- Session Config -->
                    <div class="bg-white p-8 rounded-[40px] shadow-xl shadow-green-50/50 border border-white space-y-6">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] block">Session Settings</label>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Late After (min)</label>
                                <input type="number" id="late-threshold" value="15" min="0" class="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center font-black text-gray-700 focus:border-green-400 outline-none shadow-inner">
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Auto Close (min)</label>
                                <input type="number" id="auto-close" value="0" min="0" placeholder="0 = manual" class="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center font-black text-gray-700 focus:border-green-400 outline-none shadow-inner">
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Session Note (Optional)</label>
                            <input type="text" id="session-note" placeholder="e.g. Lab class, Room 302" class="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 focus:border-green-400 outline-none shadow-inner placeholder:opacity-30">
                        </div>
                    </div>

                    <!-- Geofence -->
                    <div class="bg-white p-8 rounded-[40px] shadow-xl shadow-green-50/50 border border-white space-y-6">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] block">Location Perimeter</label>
                        <div class="flex flex-wrap items-end gap-4">
                            <button type="button" id="capture-loc-btn" class="bg-green-50 text-green-600 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 border border-green-200 transition-colors flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Use Current Location
                            </button>
                            <div class="flex items-center gap-2">
                                <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Radius</label>
                                <input type="number" id="geo-radius" value="100" min="10" step="10" class="w-20 p-2 text-center bg-white border border-green-200 rounded-xl font-black text-green-600 focus:border-green-500 outline-none text-sm">
                                <span class="text-[9px] font-black text-gray-400 uppercase">M</span>
                            </div>
                        </div>
                        <div id="att-map" class="w-full h-[400px] rounded-2xl border-2 border-green-200 overflow-hidden relative z-0"></div>
                        <div class="text-[8px] font-black text-green-400 uppercase tracking-widest text-center" id="att-coords">LAT: -- | LNG: --</div>
                    </div>

                    <div id="setup-error" class="text-red-500 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-50 py-4 rounded-2xl border border-red-100"></div>

                    <button id="start-session-btn" class="w-full bg-green-600 text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-green-200/50 hover:shadow-green-300 hover:-translate-y-1 active:scale-[0.98] transition-all">
                        Start Broadcasting
                    </button>
                </main>
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
        <div class="flex items-start justify-center min-h-screen bg-gray-950 py-8 px-4">
            <div class="w-full max-w-4xl space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between bg-gray-900 p-6 rounded-3xl border border-gray-800">
                    <div>
                        <h1 class="text-xl font-black text-white uppercase tracking-tight">${activeSession.className}</h1>
                        <p class="text-[9px] font-black text-green-400 uppercase tracking-[0.3em] mt-1">LIVE SESSION — QR ROTATING</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <button id="export-csv-btn" class="px-5 py-3 bg-gray-800 text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 hover:text-white transition-all border border-gray-700">Export CSV</button>
                        <button id="close-session-btn" class="px-5 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">End Session</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <!-- QR Panel -->
                    <div class="lg:col-span-3 bg-white p-10 rounded-[40px] flex flex-col items-center justify-center shadow-2xl">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Scan to Check In</p>
                        <div id="qr-canvas-container" class="w-72 h-72 flex items-center justify-center bg-gray-50 rounded-3xl border border-gray-100 shadow-inner mb-6">
                            <canvas id="qr-canvas"></canvas>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                            <span id="current-code-display" class="text-xs font-black text-gray-400 uppercase tracking-[0.3em] font-mono">---</span>
                        </div>
                    </div>

                    <!-- Live Feed -->
                    <div class="lg:col-span-2 bg-gray-900 rounded-[40px] border border-gray-800 overflow-hidden flex flex-col max-h-[600px]">
                        <div class="p-6 border-b border-gray-800 flex items-center justify-between">
                            <p class="text-[10px] font-black text-green-400 uppercase tracking-[0.3em]">Live Feed</p>
                            <div class="flex items-center gap-2">
                                <span id="checkin-count" class="text-lg font-black text-white">0</span>
                                <span class="text-[9px] font-black text-gray-500 uppercase">checked in</span>
                            </div>
                        </div>
                        <div id="live-feed" class="flex-1 overflow-y-auto p-4 space-y-2">
                            <p class="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center py-8 italic">Waiting for students...</p>
                        </div>
                    </div>
                </div>

                ${activeSession.note ? `<div class="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center"><span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">${activeSession.note}</span></div>` : ''}
            </div>
        </div>`;

        // Start code rotation
        let currentCode = activeSession.currentCode;
        const renderQR = (code) => {
            const canvas = document.getElementById('qr-canvas');
            if (!canvas) return;
            const payload = JSON.stringify({ s: activeSession.id, c: code });
            QRCode.toCanvas(canvas, payload, { width: 256, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } });
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
                feed.innerHTML = '<p class="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center py-8 italic">Waiting for students...</p>';
                return;
            }

            feed.innerHTML = checkedIn.slice().reverse().map(s => `
                <div class="flex items-center justify-between bg-gray-800 p-4 rounded-2xl border border-gray-700 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white">${(s.name || '?')[0].toUpperCase()}</div>
                        <div>
                            <p class="text-xs font-black text-white">${s.name || s.email}</p>
                            <p class="text-[9px] font-bold text-gray-500">${new Date(s.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'LATE' ? 'bg-amber-900/50 text-amber-400 border border-amber-700' : 'bg-green-900/50 text-green-400 border border-green-700'}">${s.status}</span>
                </div>
            `).join('');
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
        <div class="flex items-center justify-center min-h-screen bg-premium-gradient">
            <div class="w-16 h-1 bg-green-500 rounded-full animate-pulse mb-8"></div>
            <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Syncing Active Sessions...</p>
        </div>`;

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
