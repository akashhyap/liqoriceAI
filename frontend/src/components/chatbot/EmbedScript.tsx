import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface EmbedScriptProps {
    chatbotId: string;
}

const EmbedScript: React.FC<EmbedScriptProps> = ({ chatbotId }) => {
    const [copied, setCopied] = useState(false);
    
    // Get the API URL from environment variable or use a default URL
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    const scriptContent = `<script>
(function() {
    // Create widget container
    const container = document.createElement('div');
    container.id = 'fastbots-widget-${chatbotId}';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Create chat button
    const button = document.createElement('button');
    button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white"/></svg>';
    button.style.width = '56px';
    button.style.height = '56px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#2563eb';
    button.style.border = 'none';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)';
    button.style.transition = 'all 0.2s ease';
    container.appendChild(button);

    button.onmouseover = () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    };
    button.onmouseout = () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)';
    };

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.style.display = 'none';
    chatWindow.style.position = 'absolute';
    chatWindow.style.bottom = '0';
    chatWindow.style.right = '0';
    chatWindow.style.width = '380px';
    chatWindow.style.height = '600px';
    chatWindow.style.backgroundColor = 'white';
    chatWindow.style.borderRadius = '16px';
    chatWindow.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    chatWindow.style.overflow = 'hidden';
    chatWindow.style.transition = 'all 0.3s ease';
    container.appendChild(chatWindow);

    // Create chat interface
    const header = document.createElement('div');
    header.style.padding = '16px 20px';
    header.style.backgroundColor = '#2563eb';
    header.style.color = 'white';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = '<div style="font-weight: 600; font-size: 16px;">Chat</div>';
    
    // Add buttons container to header
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '8px';
    
    // Add enlarge button to header
    const enlargeButton = document.createElement('button');
    enlargeButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>';
    enlargeButton.style.background = 'none';
    enlargeButton.style.border = 'none';
    enlargeButton.style.padding = '4px';
    enlargeButton.style.cursor = 'pointer';
    enlargeButton.style.color = 'white';
    enlargeButton.style.display = 'flex';
    enlargeButton.style.alignItems = 'center';
    enlargeButton.style.justifyContent = 'center';
    enlargeButton.style.borderRadius = '50%';
    enlargeButton.style.transition = 'background-color 0.2s';
    enlargeButton.onmouseover = () => {
        enlargeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    };
    enlargeButton.onmouseout = () => {
        enlargeButton.style.backgroundColor = 'transparent';
    };

    // Add close button to header
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white"/></svg>';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.padding = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = 'white';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.borderRadius = '50%';
    closeButton.style.transition = 'background-color 0.2s';
    closeButton.onmouseover = () => {
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.backgroundColor = 'transparent';
    };

    // Add buttons to container
    buttonsContainer.appendChild(enlargeButton);
    buttonsContainer.appendChild(closeButton);
    header.appendChild(buttonsContainer);
    chatWindow.appendChild(header);

    // Create iframe for chat
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = 'calc(100% - 130px)';
    iframe.style.border = 'none';
    iframe.src = \`${window.location.protocol}//${window.location.host}/chat/${chatbotId}\`;
    chatWindow.appendChild(iframe);

    // Toggle chat window
    let isEnlarged = false;
    button.onclick = () => {
        const isVisible = chatWindow.style.display === 'block';
        chatWindow.style.display = isVisible ? 'none' : 'block';
        chatWindow.style.opacity = isVisible ? '0' : '1';
        button.style.display = isVisible ? 'flex' : 'none';
    };

    // Close chat window
    closeButton.onclick = () => {
        chatWindow.style.display = 'none';
        chatWindow.style.opacity = '0';
        button.style.display = 'flex';
        // Reset size when closing
        if (isEnlarged) {
            toggleEnlarge();
        }
    };

    // Toggle enlarge window
    const toggleEnlarge = () => {
        isEnlarged = !isEnlarged;
        chatWindow.style.width = isEnlarged ? '600px' : '380px';
        chatWindow.style.height = isEnlarged ? '700px' : '600px';
        enlargeButton.innerHTML = isEnlarged 
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="white"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>';
    };

    enlargeButton.onclick = toggleEnlarge;

    // Handle sending messages
    const sendMessage = async () => {
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        const userMessage = document.createElement('div');
        userMessage.style.marginBottom = '12px';
        userMessage.style.textAlign = 'right';
        const userText = document.createElement('span');
        userText.style.backgroundColor = '#f3f4f6';
        userText.style.color = '#1f2937';
        userText.style.padding = '9px 25px';
        userText.style.borderRadius = '20px';
        userText.style.display = 'inline-block';
        userText.style.maxWidth = '80%';
        userText.style.wordWrap = 'break-word';
        userText.style.fontSize = '14px';
        userText.textContent = message;
        userMessage.appendChild(userText);
        messagesContainer.appendChild(userMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        input.value = '';

        try {
            const response = await fetch(\`${apiUrl}/v1/visitor/chat\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    chatbotId: chatbotId.replace('$', '') // Remove $ prefix if present
                })
            });

            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }

            const data = await response.json();
            
            // Add bot message
            const botMessage = document.createElement('div');
            botMessage.style.marginBottom = '12px';
            botMessage.style.display = 'flex';
            botMessage.style.gap = '8px';
            botMessage.style.alignItems = 'flex-start';

            const botIcon = document.createElement('div');
            botIcon.style.width = '28px';
            botIcon.style.height = '28px';
            botIcon.style.borderRadius = '50%';
            botIcon.style.backgroundColor = '#19C37D';
            botIcon.style.display = 'flex';
            botIcon.style.alignItems = 'center';
            botIcon.style.justifyContent = 'center';
            botIcon.style.flexShrink = '0';
            botIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z" fill="white"/></svg>';
            
            const botText = document.createElement('div');
            botText.style.color = '#1f2937';
            botText.style.fontSize = '14px';
            botText.style.lineHeight = '1.5';
            botText.style.maxWidth = 'calc(80% - 36px)';
            botText.style.wordWrap = 'break-word';
            botText.textContent = data.message;

            botMessage.appendChild(botIcon);
            botMessage.appendChild(botText);
            messagesContainer.appendChild(botMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = document.createElement('div');
            errorMessage.style.marginBottom = '12px';
            errorMessage.style.textAlign = 'center';
            errorMessage.style.color = '#ef4444';
            errorMessage.style.fontSize = '14px';
            errorMessage.textContent = 'Failed to send message. Please try again.';
            messagesContainer.appendChild(errorMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    // Handle input events
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };
    sendButton.onclick = sendMessage;
})();
</script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(scriptContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Embed Script</Typography>
                <IconButton onClick={handleCopy} color={copied ? "success" : "default"}>
                    {copied ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Copy and paste this script into your website's HTML to add the chatbot widget.
            </Typography>
            <Box
                component="pre"
                sx={{
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    overflow: 'auto',
                    '& code': {
                        fontFamily: 'monospace',
                    },
                }}
            >
                <code>{scriptContent}</code>
            </Box>
        </Paper>
    );
};

export default EmbedScript;
