import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    IconButton,
    Alert,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsed: string;
}

const ApiKeySettings: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

    const generateApiKey = async () => {
        if (!newKeyName.trim()) {
            setError('Please enter a name for the API key');
            return;
        }

        try {
            const response = await fetch('/api/user/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newKeyName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate API key');
            }

            const newKey = await response.json();
            setApiKeys([...apiKeys, newKey]);
            setNewKeyName('');
            setSuccess(true);
            setShowKey({ ...showKey, [newKey.id]: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const toggleKeyVisibility = (keyId: string) => {
        setShowKey((prev) => ({
            ...prev,
            [keyId]: !prev[keyId]
        }));
    };

    const handleDeleteKey = (keyId: string) => {
        setSelectedKeyId(keyId);
        setShowDeleteDialog(true);
    };

    const confirmDeleteKey = async () => {
        if (!selectedKeyId) return;

        try {
            const response = await fetch(`/api/user/api-keys/${selectedKeyId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete API key');
            }

            setApiKeys(apiKeys.filter((key) => key.id !== selectedKeyId));
            setShowDeleteDialog(false);
            setSelectedKeyId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    API Keys
                </Typography>

                <Stack spacing={3}>
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Operation completed successfully
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="API Key Name"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="Enter a name for your API key"
                        />
                        <Button
                            variant="contained"
                            onClick={generateApiKey}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            Generate Key
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>API Key</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Last Used</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apiKeys.map((apiKey) => (
                                    <TableRow key={apiKey.id}>
                                        <TableCell>{apiKey.name}</TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                {showKey[apiKey.id]
                                                    ? apiKey.key
                                                    : '••••••••••••••••'}
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        toggleKeyVisibility(apiKey.id)
                                                    }
                                                >
                                                    {showKey[apiKey.id] ? (
                                                        <VisibilityOffIcon />
                                                    ) : (
                                                        <VisibilityIcon />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleCopyKey(apiKey.key)
                                                    }
                                                >
                                                    <ContentCopyIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                apiKey.createdAt
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                apiKey.lastUsed
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="error"
                                                onClick={() =>
                                                    handleDeleteKey(apiKey.id)
                                                }
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>

                <Dialog
                    open={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                >
                    <DialogTitle>Delete API Key</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this API key? This action
                            cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteKey}
                            color="error"
                            variant="contained"
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default ApiKeySettings;
