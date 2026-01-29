const routes = {};

export const initRouter = () => {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Load initial route
};

export const addRoute = (hash, handler) => {
    routes[hash] = handler;
};

export const navigateTo = (hash) => {
    window.location.hash = hash;
};

const handleRoute = async () => {
    let hash = window.location.hash;

    // Default to #login if empty
    if (!hash) {
        hash = '#login';
        window.history.replaceState(null, null, '#login');
    }

    // Strip query parameters for matching
    const baseRoute = hash.split('?')[0];
    const handler = routes[baseRoute];
    const app = document.getElementById('app');

    // Simple transition or clearing
    app.innerHTML = '';

    // Check if handler exists
    if (handler) {
        try {
            await handler();
        } catch (error) {
            console.error("Error rendering route:", error);
            app.innerHTML = '<div class="p-4 text-red-500">Error loading page.</div>';
        }
    } else {
        app.innerHTML = '<div class="p-10 text-center text-xl">404 - Page Not Found</div>';
    }
};
