import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { renderLoader } from '../../shared/loader.js';

export const UITestPage = () => {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="p-6 space-y-8 max-w-lg mx-auto">
            <header>
                <h1 class="text-3xl font-bold text-gray-900">UI Kitchen Sink</h1>
                <p class="text-gray-500">Testing component visuals.</p>
            </header>

            <section class="space-y-4">
                <h2 class="text-xl font-semibold border-b pb-2">Buttons</h2>
                ${renderButton({ text: 'Primary Button', variant: 'primary', id: 'btn-primary' })}
                ${renderButton({ text: 'Secondary Button', variant: 'secondary', id: 'btn-secondary' })}
                ${renderButton({ text: 'Danger Button', variant: 'danger', id: 'btn-danger' })}
            </section>

            <section class="space-y-4">
                <h2 class="text-xl font-semibold border-b pb-2">Inputs</h2>
                ${renderInput({ id: 'input-text', label: 'Email Address', placeholder: 'user@example.com', type: 'email' })}
                ${renderInput({ id: 'input-pass', label: 'Password', type: 'password' })}
            </section>

            <section class="space-y-4">
                <h2 class="text-xl font-semibold border-b pb-2">Loaders</h2>
                ${renderLoader()}
            </section>

            <div class="pt-8 text-center">
                 <button onclick="location.hash='#login'" class="text-blue-500 underline">Back to Login</button>
            </div>
        </div>
    `;

    // Attach listeners
    document.getElementById('btn-primary')?.addEventListener('click', () => alert('Primary Clicked'));
};
