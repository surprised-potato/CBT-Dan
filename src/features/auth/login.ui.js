import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';

export const renderLoginUI = () => {
    return `
        <div class="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-[#020617]">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-blue-600/10"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-indigo-600/10 animate-[mesh-float_25s_infinite_alternate]"></div>
            
            <!-- Glassmorphism Main Card -->
            <div class="glass-panel p-10 rounded-[60px] w-full max-w-md animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden ring-1 ring-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)]">
                <!-- Inner Accent Glow -->
                <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                
                <div class="text-center mb-12 relative z-10">
                    <div class="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(37,99,235,0.4)] relative group transition-transform duration-700 hover:scale-110">
                        <div class="absolute inset-0 bg-blue-400 rounded-[35px] animate-pulse opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                        <svg class="w-12 h-12 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <h1 class="text-4xl font-black text-white tracking-tighter uppercase mb-1">Cognita</h1>
                    <p class="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">Secure Knowledge Portal</p>
                </div>
                
                <form id="login-form" class="space-y-8 relative z-10">
                    <div class="space-y-2">
                        ${renderInput({
        id: 'email',
        type: 'email',
        label: 'Registry Identifier',
        placeholder: 'associate@cognita.io',
        required: true,
        classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20'
    })}
                        
                        <div class="space-y-4">
                            ${renderInput({
        id: 'password',
        type: 'password',
        label: 'Operational Key',
        placeholder: '••••••••',
        required: true,
        showToggle: true,
        classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20'
    })}
                            <div class="flex justify-end px-4">
                                <button type="button" id="forgot-password-link" class="text-[10px] font-black text-blue-400/60 hover:text-blue-400 uppercase tracking-widest transition-all">Restore Access</button>
                            </div>
                        </div>
                    </div>

                    <div id="error-msg" class="text-red-400 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-500/10 py-4 px-6 rounded-2xl border border-red-500/20 backdrop-blur-md animate-in fade-in slide-in-from-top-1"></div>
                    <div id="forgot-password-status" class="hidden text-center py-3 px-6 rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md animate-in fade-in slide-in-from-top-1"></div>

                    <button type="submit" id="login-submit-btn" class="w-full bg-blue-600 text-white p-6 rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20">
                        <span>Authenticate</span>
                    </button>
                </form>

                <div class="relative my-12 z-10">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-white/5"></div>
                    </div>
                    <div class="relative flex justify-center text-[10px] font-black uppercase tracking-[0.5em]">
                        <span class="px-6 bg-transparent text-white/20">Verification</span>
                    </div>
                </div>

                <div class="relative z-10">
                    <button id="google-btn" type="button" class="w-full bg-white/5 p-6 rounded-[28px] font-black uppercase text-[10px] tracking-widest text-white/50 flex items-center justify-center gap-4 hover:bg-white/10 hover:text-white transition-all border border-white/5 backdrop-blur-md active:scale-95">
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        </svg>
                        Cloud Registry
                    </button>
                </div>

                <p class="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 relative z-10 leading-loose">
                    Unauthorized Personnel? <a href="#register" class="text-blue-400 hover:text-blue-300 transition-colors ml-2 underline underline-offset-8 decoration-blue-500/30">Connect Here</a>
                </p>
            </div>
        </div>
    `;
};
