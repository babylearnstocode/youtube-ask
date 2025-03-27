import {Request} from 'express';
import { createSupabaseClient } from '../helpers/supabaseClientHelpers';
import { OpenAIEmbeddings } from '@langchain/openai';

export async function storeDocumentService(req: Request) {
 try {
    const supabase = createSupabaseClient();
    const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-3-large-',
        apiKey: process.env.OPENAI_API_KEY
    })
    
 } catch (error) {
    console.log(error);
    return{
        message: 'Error storing document'       
    }
    
 }

    return{
        message: 'Document stored successfully'
    }
}