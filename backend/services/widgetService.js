const crypto = require('crypto');
const logger = require('./loggerService');

class WidgetService {
    generateWidgetScript(chatbot) {
        try {
            // Generate a unique widget ID
            const widgetId = `fb-${crypto.randomBytes(8).toString('hex')}`;
            
            // Create the widget configuration
            const config = {
                botId: chatbot._id,
                version: chatbot.deployment.version,
                endpoint: chatbot.deployment.currentEndpoint,
                settings: {
                    theme: {
                        primaryColor: '#2563eb', // Default blue color
                        fontFamily: 'Inter, system-ui, sans-serif',
                        borderRadius: '8px',
                        buttonColor: '#2563eb',
                        backgroundColor: '#ffffff',
                        headerColor: '#1e40af'
                    },
                    position: 'bottom-right',
                    initialMessage: 'Hello! How can I help you today?',
                    placeholder: 'Type your message here...',
                    windowSize: {
                        height: '600px',
                        width: '400px'
                    },
                    branding: {
                        logo: process.env.WIDGET_LOGO_URL,
                        name: 'FastBots AI'
                    }
                }
            };

            // Generate the widget script
            const script = `
<!-- FastBots Widget -->
<div id="${widgetId}"></div>
<script>
    (function(w,d,s,o,f,js,fjs){
        w['FastBots']=o;w[o]=w[o]||function(){
        (w[o].q=w[o].q||[]).push(arguments)};
        js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
        js.id='fastbots-widget';
        js.src='${process.env.WIDGET_URL}/widget.js';
        js.async=1;
        fjs.parentNode.insertBefore(js,fjs);
    }(window,document,'script','fbq'));

    fbq('init', ${JSON.stringify(config)});
</script>
<noscript>Please enable JavaScript to use the chatbot.</noscript>
<!-- End FastBots Widget -->`;

            logger.info('Generated widget script', { chatbotId: chatbot._id });
            return {
                widgetId,
                script: script.trim()
            };
        } catch (error) {
            logger.error('Error generating widget script:', {
                chatbotId: chatbot._id,
                error: error.message
            });
            throw error;
        }
    }

    generateWidgetStyles() {
        return `
.fastbots-widget {
    position: fixed;
    z-index: 9999;
    max-height: 90vh;
    max-width: 90vw;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.fastbots-widget-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: var(--fb-primary-color, #2563eb);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.fastbots-widget-button:hover {
    transform: scale(1.1);
}

.fastbots-chat-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--fb-bg-color, #ffffff);
}

.fastbots-chat-header {
    padding: 16px;
    background-color: var(--fb-header-color, #1e40af);
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.fastbots-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.fastbots-message {
    margin-bottom: 12px;
    max-width: 80%;
}

.fastbots-message-user {
    margin-left: auto;
    background-color: var(--fb-primary-color, #2563eb);
    color: white;
    border-radius: 16px 16px 4px 16px;
    padding: 8px 16px;
}

.fastbots-message-bot {
    margin-right: auto;
    background-color: #f3f4f6;
    border-radius: 16px 16px 16px 4px;
    padding: 8px 16px;
}

.fastbots-input-container {
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 8px;
}

.fastbots-input {
    flex: 1;
    padding: 8px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    outline: none;
    font-size: 14px;
}

.fastbots-input:focus {
    border-color: var(--fb-primary-color, #2563eb);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.fastbots-send-button {
    background-color: var(--fb-primary-color, #2563eb);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.fastbots-send-button:hover {
    opacity: 0.9;
}

@media (max-width: 640px) {
    .fastbots-widget {
        width: 100% !important;
        height: 100% !important;
        max-height: 100vh !important;
        max-width: 100vw !important;
        border-radius: 0 !important;
    }
}`;
    }
}

module.exports = new WidgetService();
