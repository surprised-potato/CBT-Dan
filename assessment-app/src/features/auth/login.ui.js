import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';

export const renderLoginUI = () => {
    return `
        <div class="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm animate-fade-in">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p class="text-gray-500 mt-2">Sign in to your account</p>
                </div>
                
                <form id="login-form" class="space-y-4">
                    ${renderInput({
        id: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'name@school.edu',
        required: true
    })}
                    
                    ${renderInput({
        id: 'password',
        type: 'password',
        label: 'Password',
        placeholder: '••••••••',
        required: true
    })}

                    <div id="error-msg" class="text-red-500 text-sm hidden text-center"></div>

                    ${renderButton({
        text: 'Sign In',
        type: 'submit',
        variant: 'primary',
        classes: 'mt-2'
    })}
                </form>

                <div class="relative my-6">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-200"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                ${renderButton({
        text: 'Sign in with Google',
        type: 'button',
        id: 'google-btn',
        variant: 'secondary',
        classes: 'font-medium'
    })}

                <p class="mt-6 text-center text-sm text-gray-600">
                    Need an account? <a href="#register" class="text-blue-600 font-semibold hover:underline">Register here</a>
                </p>
            </div>
        </div>
    `;
};
