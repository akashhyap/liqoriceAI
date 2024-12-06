// Centralized configuration file
export default {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    index: process.env.PINECONE_INDEX || '',
    host: process.env.PINECONE_HOST || '',
  },
  // Add other configuration settings as needed
};
