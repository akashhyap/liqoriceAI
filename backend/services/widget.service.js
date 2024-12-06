const generateWidgetScript = async (chatbot) => {
    const widgetId = `fastbots-widget-${chatbot._id}`;
    const apiEndpoint = `${process.env.BACKEND_URL}/chat/${chatbot._id}`;
    
    const script = `
<script>
(function() {
    // Create widget container
    const container = document.createElement('div');
    container.id = '${widgetId}';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Create chat button
    const button = document.createElement('button');
    button.innerHTML = '💬';
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '30px';
    button.style.backgroundColor = '#007bff';
    button.style.border = 'none';
    button.style.color = 'white';
    button.style.fontSize = '24px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    container.appendChild(button);

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.style.display = 'none';
    chatWindow.style.position = 'absolute';
    chatWindow.style.bottom = '80px';
    chatWindow.style.right = '0';
    chatWindow.style.width = '350px';
    chatWindow.style.height = '500px';
    chatWindow.style.backgroundColor = 'white';
    chatWindow.style.borderRadius = '10px';
    chatWindow.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    chatWindow.style.overflow = 'hidden';
    container.appendChild(chatWindow);

    // Create chat interface
    const header = document.createElement('div');
    header.style.padding = '15px';
    header.style.backgroundColor = '#007bff';
    header.style.color = 'white';
    header.innerHTML = '${chatbot.name}';
    chatWindow.appendChild(header);

    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.style.height = 'calc(100% - 120px)';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.padding = '15px';
    chatWindow.appendChild(messagesContainer);

    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.style.padding = '15px';
    inputContainer.style.borderTop = '1px solid #eee';
    inputContainer.style.display = 'flex';
    inputContainer.style.gap = '10px';
    chatWindow.appendChild(inputContainer);

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.flex = '1';
    input.style.padding = '8px 12px';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '4px';
    input.style.outline = 'none';
    inputContainer.appendChild(input);

    // Create send button
    const sendButton = document.createElement('button');
    sendButton.innerHTML = '➤';
    sendButton.style.padding = '8px 16px';
    sendButton.style.backgroundColor = '#007bff';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '4px';
    sendButton.style.color = 'white';
    sendButton.style.cursor = 'pointer';
    inputContainer.appendChild(sendButton);

    // Toggle chat window
    button.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
    };

    // Handle sending messages
    const sendMessage = async () => {
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        const userMessage = document.createElement('div');
        userMessage.style.marginBottom = '10px';
        userMessage.style.textAlign = 'right';
        userMessage.innerHTML = \`<span style="background-color: #007bff; color: white; padding: 8px 12px; border-radius: 15px; display: inline-block; max-width: 80%; word-wrap: break-word;">\${message}</span>\`;
        messagesContainer.appendChild(userMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        input.value = '';

        try {
            const response = await fetch('${apiEndpoint}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            if (data.success) {
                // Add bot message
                const botMessage = document.createElement('div');
                botMessage.style.marginBottom = '10px';
                botMessage.innerHTML = \`<span style="background-color: #f0f0f0; padding: 8px 12px; border-radius: 15px; display: inline-block; max-width: 80%; word-wrap: break-word;">\${data.message}</span>\`;
                messagesContainer.appendChild(botMessage);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = document.createElement('div');
            errorMessage.style.marginBottom = '10px';
            errorMessage.style.color = 'red';
            errorMessage.style.textAlign = 'center';
            errorMessage.innerHTML = 'Failed to send message. Please try again.';
            messagesContainer.appendChild(errorMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    sendButton.onclick = sendMessage;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
})();
</script>`;

    return {
        widgetId,
        script
    };
};

const generateWidgetStyles = () => {
    return `
        #fastbots-widget {
            font-family: Arial, sans-serif;
        }
        
        #fastbots-widget button {
            background: #007bff;
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            font-size: 24px;
            transition: transform 0.2s;
        }
        
        #fastbots-widget button:hover {
            transform: scale(1.1);
        }
        
        #fastbots-widget .chat-window {
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: none;
            height: 500px;
            width: 350px;
            margin-bottom: 10px;
        }
    `;
};

export { generateWidgetScript, generateWidgetStyles };
