import React, { useState } from 'react';
import { Box, Typography, Avatar, useTheme, IconButton, Tooltip, Link, Paper } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, role, timestamp }) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const isAssistant = role === 'assistant';

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSpecialContent = (content: React.ReactNode) => {
    if (typeof content !== 'string') return content;

    // Format phone numbers, emails, and special links
    const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const calendlyRegex = /https:\/\/calendly\.com\/[^\s]+/g;
    const urlRegex = /(https?:\/\/(?!calendly\.com)[^\s]+)/g;

    let formattedContent = content;

    // Replace phone numbers with clickable links
    formattedContent = formattedContent.replace(phoneRegex, (match) => {
      const cleanNumber = match.replace(/\D/g, '');
      return `<a href="tel:${cleanNumber}" style="color: ${theme.palette.primary.main}; text-decoration: none;"><span style="display: inline-flex; align-items: center; gap: 4px;"><svg style="width: 16px; height: 16px;" viewBox="0 0 24 24"><path fill="currentColor" d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02c-.37-1.11-.56-2.3-.56-3.53c0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99C3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>${match}</span></a>`;
    });

    // Replace emails with clickable mailto links
    formattedContent = formattedContent.replace(emailRegex, (match) => {
      return `<a href="mailto:${match}" style="color: ${theme.palette.primary.main}; text-decoration: none;"><span style="display: inline-flex; align-items: center; gap: 4px;"><svg style="width: 16px; height: 16px;" viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5l-8-5V6l8 5l8-5v2z"/></svg>${match}</span></a>`;
    });

    // Replace Calendly links with styled "Schedule Appointment" text
    formattedContent = formattedContent.replace(calendlyRegex, (match) => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" style="color: ${theme.palette.primary.main}; text-decoration: none;"><span style="display: inline-flex; align-items: center; gap: 4px;"><svg style="width: 16px; height: 16px;" viewBox="0 0 24 24"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>Schedule Appointment</span></a>`;
    });

    // Replace other URLs with clickable links
    formattedContent = formattedContent.replace(urlRegex, (match) => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" style="color: ${theme.palette.primary.main}; text-decoration: none;">${match}</a>`;
    });

    return <span dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 2,
        alignItems: 'flex-start',
        justifyContent: isAssistant ? 'flex-start' : 'flex-end',
        maxWidth: '100%'
      }}
    >
      {isAssistant && (
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 40,
            height: 40
          }}
        >
          <SmartToyIcon />
        </Avatar>
      )}
      
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '85%',
          bgcolor: isAssistant ? 'background.paper' : 'primary.main',
          color: isAssistant ? 'text.primary' : 'primary.contrastText',
          borderRadius: 2,
          '& pre': {
            my: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: 'background.default',
            overflowX: 'auto'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: isAssistant ? 'primary.main' : 'inherit' }}>
                  {children}
                </Typography>
              ),
              h2: ({ children }) => (
                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: isAssistant ? 'primary.main' : 'inherit' }}>
                  {children}
                </Typography>
              ),
              h3: ({ children }) => (
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: isAssistant ? 'primary.main' : 'inherit' }}>
                  {children}
                </Typography>
              ),
              p: ({ children }) => (
                <Typography 
                  variant="body1" 
                  component="div"
                  sx={{ 
                    my: 1.5,
                    lineHeight: 1.7,
                    letterSpacing: '0.01em',
                    '&:first-of-type': { mt: 0 },
                    '&:last-of-type': { mb: 0 }
                  }}
                >
                  {React.Children.map(children, child => formatSpecialContent(child))}
                </Typography>
              ),
              ul: ({ children }) => (
                <Box component="ul" sx={{ pl: 3, my: 2, '& li': { mb: 1.5 } }}>
                  {children}
                </Box>
              ),
              ol: ({ children }) => (
                <Box component="ol" sx={{ pl: 3, my: 2, '& li': { mb: 1.5 } }}>
                  {children}
                </Box>
              ),
              li: ({ children }) => (
                <Typography 
                  component="li" 
                  variant="body1" 
                  sx={{ 
                    my: 0.5,
                    pl: 1,
                    lineHeight: 1.7,
                    '&::marker': {
                      color: isAssistant ? 'primary.main' : 'inherit',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  {React.Children.map(children, child => formatSpecialContent(child))}
                </Typography>
              ),
              blockquote: ({ children }) => (
                <Box
                  component="blockquote"
                  sx={{
                    borderLeft: 4,
                    borderColor: isAssistant ? 'primary.main' : 'primary.light',
                    pl: 2,
                    py: 1,
                    my: 2,
                    bgcolor: isAssistant ? 'action.hover' : 'primary.dark',
                    borderRadius: 1
                  }}
                >
                  {children}
                </Box>
              ),
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <Box sx={{ position: 'relative', my: 2 }}>
                    <SyntaxHighlighter
                      customStyle={{ 
                        margin: 0, 
                        borderRadius: 4,
                        fontSize: '0.9em',
                        lineHeight: 1.5
                      }}
                      style={isAssistant ? materialLight as any : materialDark as any}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                    <CopyToClipboard text={String(children)} onCopy={handleCopy}>
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: 8,
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'background.default' }
                        }}
                      >
                        <Tooltip title={copied ? "Copied!" : "Copy code"}>
                          <ContentCopyIcon fontSize="small" />
                        </Tooltip>
                      </IconButton>
                    </CopyToClipboard>
                  </Box>
                ) : (
                  <code style={{ 
                    backgroundColor: isAssistant ? theme.palette.action.hover : theme.palette.primary.dark,
                    padding: '3px 6px',
                    borderRadius: 4,
                    fontSize: '0.9em',
                    fontFamily: 'Consolas, Monaco, "Andale Mono", monospace'
                  }} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
          {new Date(timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
      
      {!isAssistant && (
        <Avatar sx={{ bgcolor: 'primary.dark', width: 40, height: 40 }}>
          <PersonIcon />
        </Avatar>
      )}
    </Box>
  );
};

export default ChatMessage;
