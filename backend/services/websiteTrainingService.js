import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from '@langchain/pinecone';
import Chatbot from '../models/Chatbot.js';
import documentService from './documentService.js';

const compiledConvert = compile({ 
    wordwrap: 130,
    selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' }
    ]
});

class WebsiteTrainingService {
    constructor() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });
    }

    async processWebsite(url, botId, options = {}) {
        try {
            // Find and update the chatbot
            const chatbot = await Chatbot.findById(botId);
            if (!chatbot) {
                throw new Error('Chatbot not found');
            }

            // Update website status to processing
            const websiteEntry = {
                url,
                lastCrawled: new Date(),
                status: 'processing'
            };
            chatbot.training.websites.push(websiteEntry);
            await chatbot.save();

            // Configure loader with timeout
            const loader = new RecursiveUrlLoader(url, {
                extractor: compiledConvert,
                maxDepth: options.maxDepth || 1, // Reduce depth to 1
                preventOutside: true,
                timeout: 30000, // 30 second timeout per page
                maxRetries: 3,  // Increase retries
                retryDelay: 1000, // Wait 1 second between retries
                excludePatterns: [
                    /\?/, // Skip URLs with query parameters
                    /\#/, // Skip anchor links
                    /cart/i, // Skip cart pages
                    /account/i, // Skip account pages
                    /login/i, // Skip login pages
                    /checkout/i, // Skip checkout pages
                    /\.pdf$/i, // Skip PDF files
                    /\.jpg$/i, // Skip images
                    /\.png$/i,
                    /\.gif$/i,
                    /\.css$/i, // Skip stylesheets
                    /\.js$/i   // Skip JavaScript files
                ]
            });

            // Add timeout for the entire load operation
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Website crawling timed out after 2 minutes')), 120000); // Increase to 2 minutes
            });

            // Load documents with timeout and better error handling
            const docs = await Promise.race([
                loader.load().catch(error => {
                    // Handle specific errors
                    if (error.code === 'ECONNREFUSED') {
                        throw new Error('Could not connect to the website. Please check if the URL is correct and the website is accessible.');
                    }
                    if (error.code === 'ENOTFOUND') {
                        throw new Error('Website not found. Please check if the URL is correct.');
                    }
                    throw error;
                }),
                timeoutPromise
            ]).catch(error => {
                console.error('Error loading website:', error);
                
                // Update website status to failed
                chatbot.training.websites = chatbot.training.websites.map(site => 
                    site.url === url 
                        ? { ...site, status: 'failed', error: error.message }
                        : site
                );
                chatbot.save().catch(err => console.error('Error saving chatbot status:', err));
                
                throw new Error(`Failed to crawl website: ${error.message}`);
            });

            if (!docs || docs.length === 0) {
                // Update website status to failed
                chatbot.training.websites = chatbot.training.websites.map(site => 
                    site.url === url 
                        ? { ...site, status: 'failed', error: 'No content could be extracted from the website' }
                        : site
                );
                await chatbot.save();
                throw new Error('No content could be extracted from the website');
            }

            console.log(`Successfully loaded ${docs.length} pages from ${url}`);

            // Split text
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200
            });
            const splitDocs = await splitter.splitDocuments(docs);

            // Store in vector database
            const { pineconeIndex } = await documentService.initPinecone();

            // Generate embeddings
            const embeddings = await this.embeddings.embedDocuments(
                splitDocs.map(doc => doc.pageContent)
            );

            // Prepare vectors with metadata
            const vectors = splitDocs.map((doc, idx) => ({
                id: documentService.generateVectorId(doc.pageContent, botId.toString()),
                values: embeddings[idx],
                metadata: {
                    content: doc.pageContent,
                    source: url,
                    sourceType: 'website',
                    chatbotId: botId.toString(),
                    title: doc.metadata?.title || '',
                    createdAt: new Date().toISOString()
                }
            }));

            // Store vectors using documentService
            await documentService.storeVectorsInPinecone(vectors, pineconeIndex);

            console.log(`Successfully stored ${vectors.length} vectors for website ${url}`);

            // Update website status to processed
            chatbot.training.websites = chatbot.training.websites.map(site => 
                site.url === url 
                    ? {
                        ...site,
                        status: 'processed',
                        lastCrawled: new Date(),
                        pagesProcessed: splitDocs.length
                    }
                    : site
            );
            chatbot.training.lastTrainingDate = new Date();
            await chatbot.save();

            return {
                success: true,
                documentsProcessed: splitDocs.length
            };
        } catch (error) {
            // Update website status to error if something fails
            const chatbot = await Chatbot.findById(botId);
            if (chatbot) {
                chatbot.training.websites = chatbot.training.websites.map(site => 
                    site.url === url 
                        ? { ...site, status: 'error', error: error.message }
                        : site
                );
                await chatbot.save();
            }

            console.error('Error processing website:', error);
            throw error;
        }
    }
}

export default new WebsiteTrainingService();
