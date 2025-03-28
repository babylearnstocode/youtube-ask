import { Request } from 'express';
import { createSupabaseClient } from '../helpers/supabaseClientHelpers';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function storeDocumentService(req: Request) {
  try {
    const { url, documentId } = req.body;

    console.log(`Storing document with ID: ${documentId} and URL: ${url}`);

    const supabase = createSupabaseClient();
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large',
      apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'embedded_documents',
      queryName: 'match_documents',
    });

    const loader = YoutubeLoader.createFromUrl(url, {
      addVideoInfo: true,
    });

    const docs = await loader.load();

    docs[0].pageContent = `Video Title: ${docs[0].metadata.title}\nVideo context: ${docs[0].pageContent}`;
    // 4. Splitting docs into smaller chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const texts = await textSplitter.splitDocuments(docs);

    // 5. Adding metadata to the documents
    const docsWithMetadata = texts.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        documentId,
      },
    }));

    // 6. Store the documents in the vector store
    await vectorStore.addDocuments(docsWithMetadata);
  } catch (error) {
    console.log(error);
    return {
      message: 'Error storing document',
    };
  }

  return {
    message: 'Document stored successfully',
  };
}
