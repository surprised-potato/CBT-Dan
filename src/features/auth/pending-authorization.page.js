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
