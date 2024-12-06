import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from "@pinecone-database/pinecone";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import logger from './loggerService.js';
import WebsiteCrawl from '../models/WebsiteCrawl.js';
import crypto from 'crypto';
import Document from '../models/Document.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Chatbot from '../models/Chatbot.js';

class DocumentService {
    constructor() {
        // Industry standard chunk parameters:
        // - 512 tokens ≈ 2048 characters for optimal embedding
        // - 20% overlap for context continuity
        // - Respect sentence boundaries for better coherence
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2048,          // Optimal for most embedding models
            chunkOverlap: 400,        // ~20% overlap
            lengthFunction: (text) => text.length,
            separators: [
                // Preserve document structure
                '\n\n\n',      // Multiple line breaks (often sections)
                '\n\n',        // Paragraph breaks
                '\n',          // Line breaks
                '. ',          // Sentences
                '! ',          // Exclamations
                '? ',          // Questions
                ';',           // Semi-colons
                ':',           // Colons
                ' ',          // Words
                ''            // Characters
            ]
        });
    }

    async initPinecone() {
        try {
            const pc = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY
            });
            
            // Initialize index with full host URL
            const pineconeIndex = pc.index(process.env.PINECONE_INDEX);
            
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY
            });
            return { pinecone: pc, pineconeIndex, embeddings };
        } catch (error) {
            logger.error('Error initializing Pinecone:', error);
            throw error;
        }
    }

    async processDocument(file, chatbotId) {
        try {
            // Create a new document record
            const document = new Document({
                chatbotId,
                type: 'document',
                fileType: file.mimetype,
                metadata: {
                    originalName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    createdAt: new Date(),
                    status: 'processing',
                    processingStartTime: new Date()
                }
            });
            await document.save();

            // Load and process the document content
            let docs;
            if (file.mimetype === 'application/pdf') {
                const loader = new PDFLoader(file.path);
                docs = await loader.load();
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const loader = new DocxLoader(file.path);
                docs = await loader.load();
            } else if (file.mimetype === 'text/plain') {
                const loader = new TextLoader(file.path);
                docs = await loader.load();
            } else if (file.mimetype === 'text/csv') {
                const loader = new CSVLoader(file.path);
                docs = await loader.load();
            } else {
                throw new Error('Unsupported file type');
            }

            if (!docs || docs.length === 0) {
                throw new Error('Document loaded but contains no content');
            }

            // Split into chunks and remove duplicates
            const splitDocs = await this.textSplitter.splitDocuments(docs);
            const uniqueChunks = Array.from(new Set(splitDocs.map(doc => doc.pageContent)))
                .map(content => splitDocs.find(doc => doc.pageContent === content));

            // Initialize Pinecone and create embeddings
            const { pineconeIndex, embeddings } = await this.initPinecone();
            
            // Create embeddings for chunks
            const embeddingResults = await embeddings.embedDocuments(
                uniqueChunks.map(doc => doc.pageContent)
            );

            // Prepare vectors
            const vectors = uniqueChunks.map((doc, idx) => ({
                id: this.generateVectorId(doc.pageContent, chatbotId.toString()),
                values: Array.from(embeddingResults[idx]),
                metadata: {
                    content: doc.pageContent,
                    source: file.originalname,
                    documentId: document._id.toString(),
                    pageNumber: String(doc.metadata?.page || '1'),
                    sourceType: 'document'
                }
            }));

            // Store vectors
            logger.info('Storing vectors in Pinecone:', {
                vectorCount: vectors.length,
                sampleMetadata: vectors[0]?.metadata,
                chatbotId: chatbotId.toString()
            });
            
            await this.storeVectorsInPinecone(vectors, pineconeIndex);
            
            logger.info('Successfully stored vectors in Pinecone');

            // Update document status and metadata
            document.metadata.status = 'completed';
            document.metadata.processingEndTime = new Date();
            document.metadata.pageCount = docs.length;
            document.metadata.chunkCount = vectors.length;
            // Estimate token count (avg 4 chars per token)
            const totalContent = uniqueChunks.reduce((acc, doc) => acc + doc.pageContent.length, 0);
            document.metadata.tokenCount = Math.ceil(totalContent / 4);
            await document.save();

            return {
                success: true,
                documentId: document._id,
                chunks: vectors.length,
                pageCount: docs.length,
                totalTokens: document.metadata.tokenCount
            };
        } catch (error) {
            logger.error('Error processing document:', {
                filename: file.originalname,
                error: error.message
            });
            throw error;
        }
    }

    async processWebsite(url, chatbotId) {
        try {
            // Normalize URL consistently
            const normalizedUrl = url.trim().toLowerCase();
            const fullUrl = new URL(normalizedUrl).toString();

            // Create or update website crawl record
            let websiteCrawl = await WebsiteCrawl.findOneAndUpdate(
                { chatbotId, url: fullUrl },
                {
                    chatbotId,
                    url: fullUrl,
                    status: 'crawling',
                    startTime: new Date()
                },
                { upsert: true, new: true }
            );

            // Update chatbot's website status
            await Chatbot.findByIdAndUpdate(
                chatbotId,
                {
                    $addToSet: {
                        'training.websites': {
                            url: fullUrl,
                            status: 'crawling',
                            startTime: new Date()
                        }
                    }
                }
            );

            logger.info(`Starting to load website content from ${fullUrl}`);
            // Load website content
            const loader = new CheerioWebBaseLoader(fullUrl, {
                selector: 'body',
                removeTags: ['script', 'style', 'nav', 'footer', 'iframe']
            });

            const docs = await loader.load();
            logger.info(`Successfully loaded website content:`, {
                url: fullUrl,
                pageCount: docs.length,
                sampleContent: docs[0]?.pageContent?.substring(0, 100)
            });

            // Split the content into chunks
            const splitDocs = await this.textSplitter.splitDocuments(docs);
            logger.info(`Split website content into chunks:`, {
                originalCount: docs.length,
                splitCount: splitDocs.length,
                sampleChunk: splitDocs[0]?.pageContent?.substring(0, 100)
            });

            // Check for duplicate content before embedding
            const uniqueChunks = Array.from(new Set(splitDocs.map(doc => doc.pageContent)))
                .map(content => splitDocs.find(doc => doc.pageContent === content));

            logger.info(`Processed chunks:`, {
                originalCount: splitDocs.length,
                uniqueCount: uniqueChunks.length,
                removedDuplicates: splitDocs.length - uniqueChunks.length
            });

            // Generate vector IDs first
            const vectorIds = uniqueChunks.map(doc => 
                this.generateVectorId(doc.pageContent, chatbotId.toString())
            );

            logger.info(`Generated vector IDs:`, {
                count: vectorIds.length,
                sampleId: vectorIds[0]
            });

            // Initialize Pinecone and create embeddings
            logger.info(`Initializing Pinecone and creating embeddings`);
            const { pinecone, pineconeIndex, embeddings } = await this.initPinecone();

            // Create embeddings for unique chunks
            const embeddingResults = await embeddings.embedDocuments(
                uniqueChunks.map(doc => doc.pageContent)
            );

            logger.info(`Created embeddings:`, {
                count: embeddingResults.length,
                dimensions: embeddingResults[0]?.length
            });

            // Prepare vectors with consistent IDs and URL
            const vectors = uniqueChunks.map((doc, idx) => ({
                id: vectorIds[idx],
                values: embeddingResults[idx],
                metadata: {
                    content: doc.pageContent,
                    source: fullUrl,
                    sourceType: 'website',
                    chatbotId: chatbotId.toString(),
                    websiteCrawlId: websiteCrawl._id.toString(),
                    title: doc.metadata.title || '',
                    createdAt: new Date().toISOString()
                }
            }));

            logger.info(`Prepared vectors for storage:`, {
                count: vectors.length,
                sampleVector: {
                    id: vectors[0]?.id,
                    metadata: vectors[0]?.metadata
                }
            });

            // Store vectors in Pinecone using upsert
            logger.info('Storing vectors in Pinecone:', {
                vectorCount: vectors.length,
                sampleMetadata: vectors[0]?.metadata,
                chatbotId: chatbotId.toString()
            });
            
            await this.storeVectorsInPinecone(vectors, pineconeIndex);
            
            logger.info('Successfully stored vectors in Pinecone');

            // Update crawl record
            websiteCrawl.status = 'completed';
            websiteCrawl.progress.embeddedChunks = uniqueChunks.length;
            websiteCrawl.progress.storedChunks = uniqueChunks.length;
            websiteCrawl.pagesProcessed = docs.length;
            await websiteCrawl.save();

            // Update chatbot's website status
            await Chatbot.findByIdAndUpdate(
                chatbotId,
                {
                    $set: {
                        'training.websites.$[elem].status': 'processed',
                        'training.websites.$[elem].pagesProcessed': docs.length,
                        'training.websites.$[elem].lastCrawled': new Date()
                    }
                },
                {
                    arrayFilters: [{ 'elem.url': fullUrl }],
                    new: true
                }
            );

            logger.info(`Successfully stored ${uniqueChunks.length} vectors for website ${fullUrl}`);
            return {
                success: true,
                chunks: uniqueChunks.length,
                pagesProcessed: docs.length
            };
        } catch (error) {
            // Update crawl record with error
            await WebsiteCrawl.findOneAndUpdate(
                { chatbotId, url: fullUrl },
                { 
                    status: 'failed',
                    error: error.message
                }
            );

            // Update chatbot's website status
            await Chatbot.findByIdAndUpdate(
                chatbotId,
                {
                    $set: {
                        'training.websites.$[elem].status': 'error',
                        'training.websites.$[elem].error': error.message
                    }
                },
                {
                    arrayFilters: [{ 'elem.url': fullUrl }],
                    new: true
                }
            );

            logger.error('Error processing website:', {
                chatbotId,
                url: fullUrl,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async getNamespaceStats(chatbotId) {
        try {
            const { pinecone, pineconeIndex } = await this.initPinecone();
            const stats = await pineconeIndex.describeIndexStats();
            
            const namespace = stats.namespaces[chatbotId.toString()];
            return namespace ? {
                vectorCount: namespace.vectorCount,
                dimensions: stats.dimension
            } : null;
        } catch (error) {
            logger.error('Error getting namespace stats:', {
                chatbotId,
                error: error.message
            });
            throw error;
        }
    }

    async deleteTrainingData(chatbotId) {
        try {
            const { pineconeIndex } = await this.initPinecone();
            
            // Delete all vectors in the namespace
            await pineconeIndex.deleteAll({
                filter: {
                    chatbotId: chatbotId.toString()
                }
            });

            // Clear website crawl records
            await WebsiteCrawl.deleteMany({ chatbotId });

            logger.info(`Successfully deleted all training data for chatbot ${chatbotId}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting training data:', {
                chatbotId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async deleteVectorsFromPinecone(chatbotId, itemId = null, sourceType = null) {
        try {
            const { pineconeIndex } = await this.initPinecone();

            if (itemId && sourceType) {
                // Delete vectors directly using deleteMany with filter
                await pineconeIndex.deleteMany({
                    filter: {
                        chatbotId: chatbotId.toString(),
                        [sourceType === 'document' ? 'documentId' : 'source']: itemId
                    }
                });
                logger.info(`Successfully deleted vectors for ${sourceType} ${itemId}`);
            } else {
                // Delete all vectors in the namespace
                await pineconeIndex.deleteAll({
                    filter: {
                        chatbotId: chatbotId.toString()
                    }
                });
                logger.info(`Deleted all vectors in namespace ${chatbotId}`);
            }
        } catch (err) {
            logger.error('Error deleting vectors from Pinecone:', {
                chatbotId,
                itemId,
                sourceType,
                error: err.message,
                stack: err.stack
            });
            throw err;
        }
    }

    async deleteDocument(chatbotId, documentId) {
        try {
            const { pineconeIndex } = await this.initPinecone();
            
            // Delete vectors with the specific document ID
            await pineconeIndex.deleteMany({
                filter: {
                    chatbotId: chatbotId.toString(),
                    documentId: documentId
                }
            });

            logger.info(`Successfully deleted document ${documentId} from chatbot ${chatbotId}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting document:', {
                chatbotId,
                documentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async deleteWebsiteData(chatbotId, websiteUrl) {
        let fullUrl;
        try {
            // Normalize URL consistently
            const normalizedUrl = websiteUrl.trim().toLowerCase();
            fullUrl = new URL(normalizedUrl).toString();
            
            // Create variations of the URL to handle different formats
            const urlVariations = [
                fullUrl,
                fullUrl.replace(/\/$/, ''),  // Without trailing slash
                fullUrl + '/',               // With trailing slash
                new URL(normalizedUrl).origin + new URL(normalizedUrl).pathname  // Without query params
            ];
            
            // First, check if website crawl record exists
            const websiteCrawl = await WebsiteCrawl.findOne({ 
                chatbotId, 
                url: { $in: urlVariations }
            });
            
            if (!websiteCrawl) {
                logger.warn(`No website crawl record found for ${fullUrl}`);
            }

            // Initialize Pinecone
            const { pineconeIndex } = await this.initPinecone();
            
            // Get stats to determine total vectors
            const stats = await pineconeIndex.describeIndexStats();
            logger.info('Pinecone index stats:', {
                stats,
                namespaces: stats.namespaces
            });

            // Get total vectors from the default namespace
            const totalVectors = stats.namespaces?.[""]?.recordCount || 0;
            const batchSize = 10000;
            const vectorIds = [];
            
            logger.info(`Scanning ${totalVectors} total vectors for website matches`);
            
            if (totalVectors > 0) {
                // Fetch vectors in batches without filtering
                const queryResponse = await pineconeIndex.query({
                    vector: new Array(1536).fill(0),
                    topK: totalVectors,
                    includeMetadata: true
                });

                logger.info('Query response:', {
                    matchesReceived: queryResponse.matches?.length || 0,
                    sampleMatches: (queryResponse.matches || []).slice(0, 3).map(match => ({
                        id: match.id,
                        metadata: match.metadata,
                        score: match.score
                    }))
                });

                // Filter matches in memory
                const matches = (queryResponse.matches || []).filter(match => {
                    const metadata = match.metadata;
                    const isMatch = metadata &&
                        metadata.chatbotId === chatbotId.toString() &&
                        metadata.sourceType === 'website' &&
                        urlVariations.includes(metadata.source);
                    
                    // Log all metadata for debugging
                    if (!isMatch && vectorIds.length === 0) {
                        logger.info('Non-matching vector metadata:', {
                            id: match.id,
                            metadata,
                            matchConditions: {
                                hasChatbotId: metadata?.chatbotId === chatbotId.toString(),
                                hasSourceType: metadata?.sourceType === 'website',
                                hasMatchingUrl: metadata?.source && urlVariations.includes(metadata.source)
                            }
                        });
                    }
                    
                    return isMatch;
                });

                // Collect vector IDs
                vectorIds.push(...matches.map(match => match.id));
                
                logger.info(`Scan results:`, {
                    totalVectorsScanned: queryResponse.matches?.length || 0,
                    matchesFound: matches.length,
                    vectorIds: vectorIds.slice(0, 5) // Log first 5 IDs
                });
            }

            logger.info(`Found ${vectorIds.length} total vectors to delete for website ${fullUrl}`);

            if (vectorIds.length > 0) {
                // Get the default namespace
                const defaultNs = pineconeIndex.namespace("");
                
                // Delete vectors in batches
                const deleteBatchSize = 100;
                for (let i = 0; i < vectorIds.length; i += deleteBatchSize) {
                    const batch = vectorIds.slice(i, i + deleteBatchSize);
                    try {
                        // Use deleteMany on the namespace with array of IDs
                        await defaultNs.deleteMany(batch);
                        logger.info(`Deleted batch of ${batch.length} vectors`);
                    } catch (err) {
                        logger.error('Error deleting vector batch:', {
                            batchSize: batch.length,
                            firstId: batch[0],
                            error: err.message
                        });
                        throw err;
                    }
                }
                
                logger.info(`Deleted all vectors for website ${fullUrl}`);
            } else {
                logger.warn(`No vectors found for website ${fullUrl} or its variations`);
                logger.info('URL variations tried:', urlVariations);
            }

            // Delete MongoDB record if it exists
            if (websiteCrawl) {
                await WebsiteCrawl.findByIdAndDelete(websiteCrawl._id);
                logger.info(`Deleted website crawl record for ${fullUrl}`);
            }

            // Remove from chatbot's websites array, checking all URL variations
            await Chatbot.findByIdAndUpdate(
                chatbotId,
                {
                    $pull: {
                        'training.websites': { 
                            url: { $in: urlVariations }
                        }
                    }
                }
            );
            
            logger.info(`Successfully deleted website data for ${fullUrl}`);
            return { success: true };
        } catch (error) {
            logger.error('Error in deleteWebsiteData:', {
                chatbotId,
                websiteUrl: fullUrl || websiteUrl,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async processDocumentContent(content, metadata, chatbotId) {
        let document;
        let tempFilePath;
        
        try {
            // Create document record
            document = new Document({
                chatbotId,
                metadata: {
                    originalName: metadata.originalName,
                    mimeType: metadata.mimeType,
                    size: metadata.size,
                    createdBy: metadata.createdBy,
                    lastModified: new Date(),
                    status: 'processing',
                    processingStartTime: new Date(),
                    chunkCount: 0,
                    processedChunkCount: 0
                }
            });

            await document.save();
            
            // Initialize variables
            let textContent;
            let splitDocs = [];
            
            if (metadata.mimeType === 'text/plain' || metadata.mimeType === 'text/csv') {
                textContent = Buffer.from(content, 'base64').toString('utf-8');
                const docs = [{
                    pageContent: textContent,
                    metadata: {
                        source: metadata.originalName
                    }
                }];
                splitDocs = await this.textSplitter.splitDocuments(docs);
            } else {
                // For binary files (PDF, DOCX, etc.), create a temporary file
                const tempDir = os.tmpdir();
                tempFilePath = path.join(tempDir, `${document._id}_${metadata.originalName}`);
                
                await fs.promises.writeFile(tempFilePath, Buffer.from(content, 'base64'));

                try {
                    // Use appropriate loader based on file type
                    let loader;
                    const fileExtension = metadata.originalName.split('.').pop().toLowerCase();
                    
                    switch (fileExtension) {
                        case 'pdf':
                            loader = new PDFLoader(tempFilePath, {
                                splitPages: true,
                                preserveFormatting: true
                            });
                            break;
                        case 'docx':
                            loader = new DocxLoader(tempFilePath);
                            break;
                        case 'txt':
                            loader = new TextLoader(tempFilePath);
                            break;
                        case 'csv':
                            loader = new CSVLoader(tempFilePath);
                            break;
                        default:
                            throw new Error(`Unsupported file type: ${fileExtension}`);
                    }

                    // Load and extract text
                    const docs = await loader.load();
                    logger.info(`Loaded ${docs.length} pages/sections from ${metadata.originalName}`);
                    
                    // Process each page/section separately
                    const processedDocs = docs.map((doc, index) => ({
                        pageContent: doc.pageContent,
                        metadata: {
                            ...doc.metadata,
                            source: metadata.originalName,
                            page: index + 1
                        }
                    }));
                    
                    // Split each document separately
                    const splitDocsPromises = processedDocs.map(doc => 
                        this.textSplitter.splitDocuments([doc])
                    );
                    const splitDocsArrays = await Promise.all(splitDocsPromises);
                    splitDocs = splitDocsArrays.flat();
                    
                    logger.info(`Split into ${splitDocs.length} chunks`);
                } finally {
                    // Clean up temp file
                    if (tempFilePath) {
                        try {
                            await fs.promises.unlink(tempFilePath);
                        } catch (unlinkError) {
                            logger.warn(`Failed to delete temporary file ${tempFilePath}:`, unlinkError);
                        }
                    }
                }
            }
            
            // Remove duplicate chunks while preserving metadata
            const uniqueChunks = splitDocs.length > 0 ? Array.from(
                new Map(splitDocs.map(doc => [doc.pageContent, doc])).values()
            ) : [];
            
            logger.info(`Processing ${uniqueChunks.length} unique chunks`);
            
            // Update document metadata
            document.metadata.chunkCount = uniqueChunks.length;
            document.metadata.status = 'embedding';
            await document.save();

            // Create embeddings and store in Pinecone
            const { pinecone, pineconeIndex, embeddings } = await this.initPinecone();
            
            // Process in batches
            const batchSize = 5; // Smaller batch size for more frequent updates
            for (let i = 0; i < uniqueChunks.length; i += batchSize) {
                const batch = uniqueChunks.slice(i, i + batchSize);
                const batchEmbeddings = await embeddings.embedDocuments(
                    batch.map(doc => doc.pageContent)
                );

                const vectors = batch.map((chunk, index) => ({
                    id: this.generateVectorId(chunk.pageContent, chatbotId.toString()),
                    values: batchEmbeddings[index],
                    metadata: {
                        content: chunk.pageContent,
                        source: metadata.originalName,
                        documentId: document._id.toString(),
                        page: chunk.metadata.page
                    }
                }));

                await this.storeVectorsInPinecone(vectors, pineconeIndex);
                
                // Update progress more frequently
                document.metadata.processedChunkCount = i + batch.length;
                document.metadata.progress = Math.round(((i + batch.length) / uniqueChunks.length) * 100);
                await document.save();
            }

            // Update final status
            document.metadata.status = 'completed';
            document.metadata.processingEndTime = new Date();
            document.metadata.progress = 100;
            await document.save();

            return {
                success: true,
                documentId: document._id,
                chunks: uniqueChunks.length
            };
        } catch (error) {
            logger.error('Error processing document content:', {
                filename: metadata.originalName,
                error: error.message
            });
            
            if (document) {
                document.metadata.status = 'error';
                document.metadata.error = error.message;
                await document.save();
            }
            
            throw error;
        }
    }

    async storeVectorsInPinecone(vectors, pineconeIndex) {
        if (!vectors || vectors.length === 0) {
            logger.warn('No vectors provided for storage');
            return 0;
        }

        if (!pineconeIndex) {
            throw new Error('Pinecone index is required for vector storage');
        }

        // Batch vectors in groups of 100 (Pinecone's limit)
        const batchSize = 100;
        let storedCount = 0;

        try {
            // Process in batches
            for (let i = 0; i < vectors.length; i += batchSize) {
                const batch = vectors.slice(i, i + batchSize);
                
                // Prepare the upsert request
                const upsertRequest = batch.map(vector => ({
                    id: vector.id,
                    values: Array.from(vector.values),
                    metadata: vector.metadata
                }));

                // Debug log
                logger.info('Upsert batch:', {
                    batchSize: upsertRequest.length,
                    sampleVectorId: upsertRequest[0]?.id,
                    sampleMetadata: JSON.stringify(upsertRequest[0]?.metadata)
                });

                // Direct upsert call
                await pineconeIndex.upsert(upsertRequest);
                
                storedCount += batch.length;
                logger.info(`Stored batch of ${batch.length} vectors. Total stored: ${storedCount}/${vectors.length}`);
            }

            return storedCount;
        } catch (error) {
            logger.error('Error storing vector batch:', {
                error: error.message,
                errorStack: error.stack,
                vectorSample: vectors[0]
            });
            throw error;
        }
    }

    // Helper method to generate consistent vector IDs
    generateVectorId(content, namespace) {
        const hash = crypto.createHash('sha256');
        hash.update(content + namespace);
        return hash.digest('hex');
    }
}

export default new DocumentService();
