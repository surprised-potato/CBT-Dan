import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';

export const renderLoginUI = () => {
    return `
        <div class="flex items-center justify-center min-h-screen px-4">
            <div class="bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-200/50 w-full max-w-md animate-in fade-in zoom-in duration-500 relative overflow-hidden border border-white">
                <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                
                <div class="text-center mb-10 relative z-10">
                    <div class="w-20 h-20 bg-blue-premium rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Operational Access</h1>
                    <p class="text-gray-500 mt-2 text-xs font-black uppercase tracking-[0.2em]">CBT Integrated Systems</p>
                </div>
                
                <form id="login-form" class="space-y-6 relative z-10">
                    <div class="space-y-4">
                        ${renderInput({
        id: 'email',
        type: 'email',
        label: 'Registry Email',
        placeholder: 'user@registry.edu',
        required: true
    })}
                        
                        ${renderInput({
        id: 'password',
        type: 'password',
        label: 'Operational Key',
        placeholder: '••••••••',
        required: true
    })}
                    </div>

                    <div id="error-msg" class="text-red-500 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-50 py-3 rounded-xl border border-red-100"></div>

                    <button type="submit" class="w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">Sign In</button>
                </form>

                <div class="relative my-8 z-10">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-100"></div>
                    </div>
                    <div class="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                        <span class="px-4 bg-white text-gray-500">OAuth Gateway</span>
                    </div>
                </div>

                <div class="relative z-10">
                    <button id="google-btn" type="button" class="w-full glass-panel p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-600 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all border border-gray-100 shadow-sm shadow-blue-50">
                        <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Google Authentication
                    </button>
                </div>

                <p class="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-500 relative z-10">
                    New Personnel? <a href="#register" class="text-blue-600 hover:underline ml-1">Initialise Account</a>
                </p>
            </div>
        </div>
    `;
};
