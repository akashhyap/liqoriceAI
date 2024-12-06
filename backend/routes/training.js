import express from 'express';
import { protect } from '../middleware/auth.js';
import documentService from '../services/documentService.js';
import websiteTrainingService from '../services/websiteTrainingService.js';
import { OpenAIEmbeddings } from "@langchain/openai";

const router = express.Router();

// Generate embeddings for a bot
router.post('/embeddings/:botId', protect, async (req, res) => {
    try {
        const { botId } = req.params;
        const { text } = req.body;

        // Initialize OpenAI embeddings
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        
        const embedding = await embeddings.embedQuery(text);
        res.json({ embedding });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Query similar vectors
router.post('/query', protect, async (req, res) => {
    try {
        const { values, namespace, topK = 5 } = req.body;

        // Initialize Pinecone client
        const { pinecone, pineconeIndex } = await documentService.initPinecone();
        
        // Query vectors
        const queryResponse = await pineconeIndex.query({
            vector: values,
            topK,
            namespace
        });

        res.json(queryResponse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete vectors for a namespace
router.delete('/vectors/:namespace', protect, async (req, res) => {
    try {
        const { namespace } = req.params;

        // Initialize Pinecone client
        const { pinecone, pineconeIndex } = await documentService.initPinecone();
        
        // Delete all vectors in namespace
        await pineconeIndex.deleteAll({
            namespace
        });
        
        res.json({ message: 'Vectors deleted successfully' });
    } catch (error) {
        console.error('Error deleting training data:', {
            error: error.message,
            namespace
        });
        res.status(500).json({ message: error.message });
    }
});

// Process document content directly
router.post('/content/:botId', protect, async (req, res) => {
    try {
        const { botId } = req.params;
        const { content, metadata } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        if (!metadata || !metadata.originalName) {
            return res.status(400).json({ message: 'Metadata with originalName is required' });
        }

        const result = await documentService.processDocumentContent(content, {
            ...metadata,
            createdBy: req.user.id
        }, botId);

        res.json(result);
    } catch (error) {
        console.error('Error processing content:', error);
        res.status(500).json({ message: error.message });
    }
});

// Train bot with website content
router.post('/website/:botId', protect, async (req, res) => {
    try {
        const { botId } = req.params;
        const { url, maxDepth } = req.body;

        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        const result = await websiteTrainingService.processWebsite(url, botId, { maxDepth });
        res.json(result);
    } catch (error) {
        console.error('Error in website training:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
