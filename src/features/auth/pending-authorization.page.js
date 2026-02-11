import { getUser, setUser } from '../../core/store.js';
import { logoutUser } from '../../services/auth.service.js';

export const PendingAuthorizationPage = () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    app.innerHTML = `
        <div class="flex items-center justify-center min-h-screen px-4 bg-premium-gradient">
            <div class="bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-200/50 w-full max-w-md text-center animate-in fade-in zoom-in duration-500 border border-white">
                <div class="w-20 h-20 bg-yellow-400 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-yellow-100">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">Registry Pending</h1>
                <p class="text-gray-600 mb-8 text-sm font-medium leading-relaxed">
                    Hello, ${user.displayName || 'Instructor'}. Your account is currently <b>Awaiting Authorization</b>.
                </p>
                <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8 text-left">
                    <h3 class="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Next Steps:</h3>
                    <ul class="text-[11px] text-blue-700/80 space-y-2 font-bold uppercase tracking-wider">
                        <li class="flex items-start gap-2">
                             <span class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></span>
                             Contact an authorized instructor
                        </li>
                        <li class="flex items-start gap-2">
                             <span class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></span>
                             Wait for administrative approval
                        </li>
                        <li class="flex items-start gap-2">
                             <span class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></span>
                             Refresh this page once authorized
                        </li>
                    </ul>
                </div>
                
                <div class="space-y-4">
                    <button id="refresh-btn" class="w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl transition-all">Check Authorization Status</button>
                    <button id="logout-btn" class="w-full bg-gray-50 text-gray-400 p-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:text-gray-600 transition-all border border-gray-100">Sign Out</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('refresh-btn').onclick = () => {
        location.reload();
    };

    document.getElementById('logout-btn').onclick = async () => {
        await logoutUser();
        window.location.hash = '#login';
    };
};
