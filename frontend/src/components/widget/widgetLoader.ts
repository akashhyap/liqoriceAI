interface WidgetConfig {
    botId: string;
    apiEndpoint: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: {
        primaryColor: string;
        fontFamily: string;
        borderRadius: string;
        buttonColor: string;
        backgroundColor: string;
        headerColor: string;
    };
}

declare global {
    interface Window {
        FastBotsWidget?: {
            init: (config: WidgetConfig) => void;
        };
    }
}

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

const loadStylesheet = (href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
        document.head.appendChild(link);
    });
};

export const initializeWidget = async (config: WidgetConfig): Promise<void> => {
    try {
        // Load required dependencies
        await Promise.all([
            loadScript('https://unpkg.com/react@18/umd/react.production.min.js'),
            loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'),
            loadStylesheet('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'),
        ]);

        // Load the widget bundle
        await loadScript(`${process.env.WIDGET_URL}/widget.bundle.js`);

        // Initialize the widget with the provided configuration
        if (window.FastBotsWidget) {
            window.FastBotsWidget.init(config);
        } else {
            console.error('FastBots Widget failed to initialize');
        }
    } catch (error) {
        console.error('Error initializing FastBots Widget:', error);
    }
};
