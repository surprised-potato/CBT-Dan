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
        <div class="flex items-center justify-center min-h-screen px-4 bg-premium-gradient py-12">
            <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-200/50 w-full max-w-md text-center animate-in fade-in zoom-in duration-500 border border-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-50"></div>
                
                <div class="w-20 h-20 bg-amber-400 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-100 relative z-10">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4 relative z-10">Registry Pending</h1>
                <p class="text-gray-500 mb-8 text-sm font-medium leading-relaxed relative z-10">
                    Hello, <b>${user.displayName || 'Associate'}</b>. Your Cognita entry is currently <b>Awaiting Authorization</b> by department heads.
                </p>
                <div class="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100 mb-8 text-left relative z-10">
                    <h3 class="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3 px-1">Next Steps:</h3>
                    <ul class="text-[10px] text-blue-700/80 space-y-3 font-bold uppercase tracking-wider">
                        <li class="flex items-start gap-3">
                             <span class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></span>
                             Contact an authorized instructor
                        </li>
                        <li class="flex items-start gap-3">
                             <span class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></span>
                             Wait for administrative approval
                        </li>
                        <li class="flex items-start gap-3">
                             <span class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></span>
                             Refresh this page once authorized
                        </li>
                    </ul>
                </div>
                
                <div class="space-y-4 relative z-10">
                    <button id="refresh-btn" class="w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl transition-all">Check Status</button>
                    <button id="logout-btn" class="w-full bg-transparent text-gray-400 p-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:text-gray-600 transition-all">Go Back to Gateway</button>
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
