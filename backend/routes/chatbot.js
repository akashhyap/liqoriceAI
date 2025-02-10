import express from 'express';
import mongoose from 'mongoose';
import { protect as auth } from '../middleware/auth.js';
import checkChatbotLimit from '../middleware/checkChatbotLimit.js';
import Chatbot from '../models/Chatbot.js';
import ChatSession from '../models/ChatSession.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { Pinecone } from '@pinecone-database/pinecone';
import documentService from '../services/documentService.js';
import ChatHistory from '../models/ChatHistory.js';
import WebsiteCrawl from '../models/WebsiteCrawl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = {
            'application/pdf': '.pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'text/plain': '.txt',
            'text/csv': '.csv',
        };
        
        if (!allowedTypes[file.mimetype]) {
            return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
    }
});

// Helper functions for widget generation
function generateWidgetScript(chatbot) {
    const chatbotConfig = {
        id: chatbot._id,
        settings: chatbot.settings,
        deployment: {
            version: chatbot.deployment.version,
            endpoint: chatbot.deployment.currentEndpoint
        }
    };
    
    return `
        (function() {
            const config = ${JSON.stringify(chatbotConfig)};
            const script = document.createElement('script');
            script.src = '${process.env.FRONTEND_URL}/widget.js';
            script.dataset.chatbotId = config.id;
            script.dataset.config = btoa(JSON.stringify(config));
            document.head.appendChild(script);
        })();
    `;
}

function generateWidgetStyles(widgetSettings = {}) {
    const defaultStyles = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        // Add more default styles as needed
    };

    return `
        #liqorice-widget {
            ${Object.entries({ ...defaultStyles, ...widgetSettings })
                .map(([key, value]) => `${key}: ${value};`)
                .join('\n')}
        }
    `;
}

// Get all chatbots for the user
router.get('/', auth, async (req, res) => {
    try {
        const chatbots = await Chatbot.find({ user: req.user.id })
            .select('name description settings deployment training analytics')
            .sort('-createdAt');
        res.json({ success: true, chatbots });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get a single chatbot
router.get('/:id', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        res.json({ success: true, chatbot });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create a new chatbot
router.post('/', auth, checkChatbotLimit, async (req, res) => {
    try {
        const { name, description, settings } = req.body;
        const chatbot = new Chatbot({
            name,
            description,
            settings,
            user: req.user.id,
            training: {
                documents: [],
                websites: [],
                lastTrainingDate: null
            },
            deployment: {
                widgetSettings: {
                    theme: 'light',
                    position: 'bottom-right'
                }
            }
        });

        await chatbot.save();
        res.status(201).json({ success: true, chatbot });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update entire chatbot
router.put('/:id', auth, async (req, res) => {
    try {
        const updates = req.body;
        
        // If deployment status is being changed to 'deployed', update version and lastDeployedAt
        if (updates.deployment?.status === 'deployed') {
            const chatbot = await Chatbot.findOne({
                _id: req.params.id,
                user: req.user.id
            });
            
            if (!chatbot) {
                return res.status(404).json({ success: false, error: 'Chatbot not found' });
            }
            
            updates.deployment = {
                ...updates.deployment,
                version: (chatbot.deployment?.version || 0) + 1,
                lastDeployedAt: new Date(),
                history: [
                    ...(chatbot.deployment?.history || []),
                    {
                        version: (chatbot.deployment?.version || 0) + 1,
                        deployedAt: new Date(),
                        status: 'deployed'
                    }
                ]
            };
        }

        const chatbot = await Chatbot.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: updates },
            { new: true }
        );

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        res.json({ success: true, chatbot });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update chatbot settings
router.patch('/:id/settings', auth, async (req, res) => {
    try {
        const updates = req.body;
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Update settings
        chatbot.settings = {
            ...chatbot.settings,
            ...updates,
            // Ensure custom prompts are properly updated
            customPrompt: {
                ...chatbot.settings.customPrompt,
                ...(updates.customPrompt || {})
            }
        };

        // Force redeployment to ensure settings are reloaded
        chatbot.deployment.version += 1;
        chatbot.deployment.status = 'deployed';
        chatbot.deployment.lastDeployedAt = new Date();
        
        // Add to deployment history
        chatbot.deployment.history.push({
            version: chatbot.deployment.version,
            deployedAt: new Date(),
            status: 'deployed',
            endpoint: chatbot.deployment.currentEndpoint
        });

        await chatbot.save();

        // Generate new widget code with updated settings
        const widgetScript = generateWidgetScript(chatbot);
        const widgetStyles = generateWidgetStyles(chatbot.deployment.widgetSettings);

        res.json({
            success: true,
            message: 'Settings updated and chatbot redeployed',
            chatbot,
            widget: {
                script: widgetScript,
                styles: widgetStyles
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Train chatbot with documents
router.post('/:id/train/documents', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        const { files } = req.body;
        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ success: false, error: 'No files provided' });
        }

        const processedDocuments = [];
        const errors = [];

        // Process each file
        for (const file of files) {
            try {
                if (!file.content || !file.metadata) {
                    throw new Error('Invalid file format. Both content and metadata are required.');
                }

                // Process document content
                const result = await documentService.processDocumentContent(
                    file.content,
                    {
                        originalName: file.metadata.name,
                        mimeType: file.metadata.type,
                        size: file.metadata.size,
                        createdBy: req.user.id
                    },
                    req.params.id // Pass chatbotId
                );
                
                // Add to processed documents
                processedDocuments.push({
                    type: 'file',
                    fileType: file.metadata.type,
                    originalName: file.metadata.name,
                    uploadDate: new Date(),
                    status: 'processed',
                    chunks: result.chunks,
                    documentId: result.documentId
                });
            } catch (error) {
                errors.push({
                    filename: file.metadata?.name || 'unknown',
                    error: error.message
                });
            }
        }

        // Update chatbot with processed documents
        if (processedDocuments.length > 0) {
            chatbot.training.documents.push(...processedDocuments);
            chatbot.training.lastTrainingDate = new Date();
            
            // Update training summary counters
            chatbot.training.totalDocuments = chatbot.training.documents.length;
            chatbot.training.totalChunks = chatbot.training.documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);
            
            // Mark chatbot as trained
            chatbot.deployment.status = 'trained';
            
            await chatbot.save();
        }

        // Get updated training stats from Pinecone
        const stats = await documentService.getNamespaceStats(chatbot._id);
        
        res.json({
            success: true,
            processed: processedDocuments.length,
            errors: errors.length > 0 ? errors : undefined,
            summary: {
                totalDocuments: chatbot.training.totalDocuments,
                totalChunks: stats.vectorCount,
                lastTrainingDate: chatbot.training.lastTrainingDate
            }
        });
    } catch (error) {
        console.error('Error processing documents:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get training documents
router.get('/:id/train/documents', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        res.json({ 
            success: true, 
            documents: chatbot.training.documents.map(doc => ({
                filename: doc.filename,
                originalName: doc.originalName,
                uploadDate: doc.uploadDate,
                type: doc.type,
                status: doc.status
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Train chatbot with websites
router.post('/:id/train/websites', auth, async (req, res) => {
    try {
        const { urls } = req.body;
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        if (!urls || urls.length === 0) {
            return res.status(400).json({ success: false, error: 'No URLs provided' });
        }

        // Add websites to training data
        const websites = urls.map(url => ({
            url,
            addedDate: new Date()
        }));

        chatbot.training.websites.push(...websites);
        chatbot.training.lastTrainingDate = new Date();
        await chatbot.save();

        res.json({ 
            success: true, 
            message: 'Websites added successfully',
            websites
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update deployment status
router.post('/:id/deploy', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Increment version number
        chatbot.deployment.version += 1;
        chatbot.deployment.status = 'deployed';
        chatbot.deployment.lastDeployedAt = new Date();
        
        // Add deployment history
        chatbot.deployment.history.push({
            version: chatbot.deployment.version,
            deployedAt: new Date(),
            status: 'deployed',
            endpoint: chatbot.deployment.currentEndpoint
        });

        await chatbot.save();

        // Generate widget code with latest config
        const widgetScript = generateWidgetScript(chatbot);
        const widgetStyles = generateWidgetStyles(chatbot.deployment.widgetSettings);

        res.json({
            success: true,
            message: 'Chatbot deployed successfully',
            deployment: chatbot.deployment,
            widget: {
                script: widgetScript,
                styles: widgetStyles
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update widget settings
router.patch('/:id/widget', auth, async (req, res) => {
    try {
        const { widgetSettings } = req.body;
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        chatbot.deployment.widgetSettings = {
            ...chatbot.deployment.widgetSettings,
            ...widgetSettings
        };
        await chatbot.save();

        res.json({
            success: true,
            message: 'Widget settings updated successfully',
            widgetSettings: chatbot.deployment.widgetSettings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete chatbot
router.delete('/:id', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Delete from Pinecone
        try {
            await documentService.deleteTrainingData(req.params.id);
        } catch (err) {
            console.error('Error deleting vectors from Pinecone:', err);
        }

        // Delete uploaded files
        chatbot.training.documents.forEach(doc => {
            const filePath = doc.path;
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        // Delete chat sessions
        await ChatSession.deleteMany({ chatbot: chatbot._id });

        // Delete chat history
        await ChatHistory.deleteMany({ chatbot: chatbot._id });

        // Delete website crawls
        await WebsiteCrawl.deleteMany({ chatbot: chatbot._id });

        // Delete the chatbot
        await Chatbot.deleteOne({ _id: chatbot._id });

        res.json({ success: true, message: 'Chatbot deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete training data
router.delete('/:id/train', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Delete documents from storage
        for (const doc of chatbot.training.documents) {
            if (doc.path) {
                try {
                    await fs.promises.unlink(doc.path);
                } catch (err) {
                    console.error(`Error deleting file ${doc.path}:`, err);
                }
            }
        }

        // Delete from Pinecone
        try {
            await documentService.deleteTrainingData(req.params.id);
        } catch (err) {
            console.error('Error deleting vectors from Pinecone:', err);
        }

        // Clear training data from database
        chatbot.training.documents = [];
        chatbot.training.websites = [];
        chatbot.training.lastTrainingDate = null;
        await chatbot.save();

        res.json({ 
            success: true, 
            message: 'All training data deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a single training document
router.delete('/:id/train/documents/:documentId', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chatbot not found'
            });
        }

        // Find the document
        const document = chatbot.training.documents.find(doc => doc._id.toString() === req.params.documentId);
        
        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Document not found'
            });
        }

        // Delete file from storage
        if (document.path) {
            try {
                await fs.promises.unlink(document.path);
            } catch (err) {
                console.error(`Error deleting file ${document.path}:`, err);
            }
        }

        // Delete from Pinecone
        try {
            await documentService.deleteTrainingData(req.params.id);
        } catch (err) {
            console.error('Error deleting vectors from Pinecone:', err);
        }

        // Remove document from database
        chatbot.training.documents = chatbot.training.documents.filter(
            doc => doc._id.toString() !== req.params.documentId
        );
        
        // Update training summary
        chatbot.training.totalDocuments = chatbot.training.documents.length;
        chatbot.training.totalChunks = chatbot.training.documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);
        
        if (chatbot.training.documents.length === 0) {
            chatbot.training.lastTrainingDate = null;
        }
        
        await chatbot.save();

        res.json({ 
            success: true, 
            message: 'Document deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'An error occurred while deleting the document'
        });
    }
});

// Get training data for a chatbot
router.get('/:id/training', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        }).lean();

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Get real-time vector count from Pinecone
        const stats = await documentService.getNamespaceStats(chatbot._id);

        const response = {
            summary: {
                documents: {
                    count: chatbot.training.documents.length,
                    status: chatbot.training.documents.length > 0 ? 'uploaded' : 'empty'
                },
                websites: {
                    count: chatbot.training.websites.length,
                    status: chatbot.training.websites.length > 0 ? 'crawled' : 'empty'
                },
                chunks: {
                    count: stats.vectorCount,
                    status: stats.vectorCount > 0 ? 'processed' : 'empty'
                },
                lastTrainingDate: chatbot.training.lastTrainingDate || null
            },
            documents: chatbot.training.documents.map(doc => ({
                type: 'document',
                name: doc.originalName || doc.filename,
                uploadDate: doc.uploadDate || doc.processedAt,
                size: doc.size || 0,
                status: doc.status || 'processed',
                chunks: doc.chunks || 0,
                error: doc.error
            })),
            websites: chatbot.training.websites.map(site => ({
                type: 'website',
                url: site.url,
                crawledAt: site.lastCrawled,
                pagesProcessed: site.pagesProcessed || 0,
                status: site.status || 'processed',
                error: site.error
            }))
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get training documents for a chatbot
router.get('/:id/training/documents', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        const documents = chatbot.training.documents || [];
        res.json({ success: true, documents });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get chat history for a chatbot
router.get('/:id/history', auth, async (req, res) => {
    try {
        // Verify chatbot ownership
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Get chat history
        const messages = await ChatHistory.find({ chatbot: req.params.id })
            .sort({ timestamp: -1 }) // Sort by newest first
            .limit(100); // Limit to last 100 messages

        // Get metrics
        const metrics = {
            totalMessages: messages.length,
            totalSessions: new Set(messages.map(m => m.sessionId)).size,
            avgResponseTime: 0,
            avgSatisfactionScore: 0
        };

        res.json({
            success: true,
            sessions: messages,
            pagination: {
                page: 1,
                limit: 100,
                total: messages.length,
                pages: 1
            },
            metrics
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get specific chat session details
router.get('/:id/history/:sessionId', auth, async (req, res) => {
    try {
        // Verify chatbot ownership
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Get session details
        const session = await ChatSession.findOne({
            _id: req.params.sessionId,
            chatbot: req.params.id
        });

        if (!session) {
            return res.status(404).json({ success: false, error: 'Chat session not found' });
        }

        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update chat session (e.g., for satisfaction score)
router.patch('/:id/history/:sessionId', auth, async (req, res) => {
    try {
        // Verify chatbot ownership
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Update session
        const session = await ChatSession.findOneAndUpdate(
            {
                _id: req.params.sessionId,
                chatbot: req.params.id
            },
            { $set: req.body },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, error: 'Chat session not found' });
        }

        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete chat message
router.delete('/:id/history/:messageId', auth, async (req, res) => {
    try {
        // Verify chatbot ownership
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Delete the message
        const message = await ChatHistory.findOneAndDelete({
            _id: req.params.messageId,
            chatbot: req.params.id
        });

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get website crawl status
router.get('/:id/train/websites/:url', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        const websiteCrawl = await WebsiteCrawl.findOne({
            chatbotId: chatbot._id,
            url: decodeURIComponent(req.params.url)
        });

        if (!websiteCrawl) {
            return res.status(404).json({ success: false, error: 'Website crawl not found' });
        }

        res.json({
            success: true,
            status: websiteCrawl.status,
            pagesProcessed: websiteCrawl.pagesProcessed,
            progress: websiteCrawl.progress,
            error: websiteCrawl.error,
            lastCrawled: websiteCrawl.lastCrawled
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete training documents
router.delete('/:id/train/documents', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ success: false, error: 'Chatbot not found' });
        }

        // Delete documents from storage
        for (const doc of chatbot.training.documents) {
            if (doc.path) {
                try {
                    await fs.promises.unlink(doc.path);
                } catch (err) {
                    console.error(`Error deleting file ${doc.path}:`, err);
                }
            }
        }

        // Delete from Pinecone
        try {
            await documentService.deleteTrainingData(req.params.id);
        } catch (err) {
            console.error('Error deleting vectors from Pinecone:', err);
        }

        // Clear document training data from database
        chatbot.training.documents = [];
        chatbot.training.totalDocuments = 0;
        chatbot.training.totalChunks = 0;
        chatbot.training.lastTrainingDate = null;
        await chatbot.save();

        res.json({ 
            success: true, 
            message: 'Training documents deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a single website from training data
router.delete('/:id/train/websites/:websiteId', auth, async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!chatbot) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chatbot not found'
            });
        }

        // Find the website
        const website = chatbot.training.websites.find(site => site._id.toString() === req.params.websiteId);
        
        if (!website) {
            return res.status(404).json({ 
                success: false, 
                message: 'Website not found'
            });
        }

        // Delete from Pinecone using the website-specific deletion
        try {
            await documentService.deleteWebsiteData(req.params.id, website.url);
        } catch (err) {
            console.error('Error deleting website data from Pinecone:', err);
        }

        // Remove website from database
        chatbot.training.websites = chatbot.training.websites.filter(
            site => site._id.toString() !== req.params.websiteId
        );
        
        // Update training summary
        chatbot.training.totalWebsites = chatbot.training.websites.length;
        
        if (chatbot.training.websites.length === 0 && chatbot.training.documents.length === 0) {
            chatbot.training.lastTrainingDate = null;
        }
        
        await chatbot.save();

        res.json({ 
            success: true, 
            message: 'Website deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'An error occurred while deleting the website'
        });
    }
});

export default router;
