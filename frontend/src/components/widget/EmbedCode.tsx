import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Snackbar,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';

interface EmbedCodeProps {
  botId: string;
  config?: {
    primaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
}

export default function EmbedCode({ botId, config }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<script>
  window.FastBotsConfig = {
    botId: "${botId}",
    primaryColor: "${config?.primaryColor || '#007bff'}",
    fontFamily: "${config?.fontFamily || 'Arial, sans-serif'}",
    borderRadius: "${config?.borderRadius || '8px'}"
  };
</script>
<script 
  async 
  src="${window.location.origin}/widget.js"
></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Embed Code
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Add this code to your website to display the chat widget:
      </Typography>
      
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2,
          backgroundColor: 'grey.50',
          position: 'relative',
          mb: 2
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {embedCode}
        </pre>
        <IconButton
          onClick={handleCopy}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
        >
          <CopyIcon />
        </IconButton>
      </Paper>

      <Stack spacing={2}>
        <Typography variant="subtitle2">
          Customize Widget Appearance
        </Typography>
        <TextField
          label="Primary Color"
          size="small"
          type="color"
          defaultValue={config?.primaryColor || '#007bff'}
          sx={{ width: 200 }}
        />
        <TextField
          label="Font Family"
          size="small"
          defaultValue={config?.fontFamily || 'Arial, sans-serif'}
          sx={{ width: 200 }}
        />
        <TextField
          label="Border Radius"
          size="small"
          defaultValue={config?.borderRadius || '8px'}
          sx={{ width: 200 }}
        />
        <Button variant="outlined" size="small" sx={{ width: 200 }}>
          Update Appearance
        </Button>
      </Stack>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Embed code copied to clipboard"
      />
    </Box>
  );
}
