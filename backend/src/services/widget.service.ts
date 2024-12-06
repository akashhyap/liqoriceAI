import { generateUUID } from "@utils/helpers.js";

interface WidgetConfig {
    botId: string;
    theme?: {
        primaryColor: string;
        fontFamily: string;
        borderRadius: string;
        buttonColor: string;
        backgroundColor: string;
        headerColor: string;
    };
}

class WidgetService {
    private baseUrl: string;
    private apiUrl: string;

    constructor() {
        this.baseUrl = process.env.WIDGET_BASE_URL || 'http://localhost:3000';
        this.apiUrl = process.env.API_URL || 'http://localhost:5000';
    }

    generateWidgetScript(config: WidgetConfig): string {
        const widgetId = generateUUID();
        const encodedConfig = encodeURIComponent(JSON.stringify({
            ...config,
            apiEndpoint: this.apiUrl,
        }));

        return `
            (function(w,d,i,t) {
                w.FastBotsWidget = w.FastBotsWidget || {};
                w.FastBotsWidget.config = ${JSON.stringify(config)};
                w.FastBotsWidget.widgetId = '${widgetId}';
                
                var s = d.createElement('script');
                s.type = 'text/javascript';
                s.async = true;
                s.src = '${this.baseUrl}/widget.js';
                var x = d.getElementsByTagName('script')[0];
                x.parentNode.insertBefore(s, x);
            })(window,document);
        `;
    }

    generateFullScreenLink(config: WidgetConfig): string {
        const params = new URLSearchParams({
            botId: config.botId,
            apiEndpoint: this.apiUrl,
            ...config.theme,
        });

        return `${this.baseUrl}/chat?${params.toString()}`;
    }
}

export const widgetService = new WidgetService();
