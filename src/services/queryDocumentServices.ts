import { Request } from 'express';
import { createSupabaseClient } from '../helpers/supabaseClientHelpers';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { Readable } from 'stream';

export async function queryDocumentService(req: Request) {
  try {
    const { conversationId, query, documentIds } = req.body;

    // 0. init supabase client
    const supabase = createSupabaseClient();

    // 1. Store user query
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: query,
    });
    // 2. Grab the conversaion history
    const { data: previousMessages } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(15);
    // 3. Initialize the embeddings models and LLM models
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large',
      apiKey: process.env.OPENAI_API_KEY,
    });

    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY,
      streamUsage: true,
    });
    // 4. Initialize the vector store
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'embedded_documents',
      queryName: 'match_documents',
      filter: {
        document_ids: documentIds,
      },
    });
    // 5. Change the prompt based on the query and chat history
    const contextualizeQSystemPrompt =
      'Given a chat history and the latest user question, ' +
      'which might reference context in the chat history, ' +
      'formulate a standalone question which can be unterstood. ' +
      'without the chat history. DO NOT answer the question' +
      'just reformulate it if needed and otherwise return it as it is. ';

    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ['system', contextualizeQSystemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ]);
    // 6. Retrieve the documents from the vector store
    const retriever = vectorStore.asRetriever();

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm,
      retriever,
      rephrasePrompt: contextualizeQPrompt,
    });
    // 7. Pass those relevant documents to the LLM
    const systemPrompt =
      'You are an assistant for question-answering tasks. ' +
      'Use the following pieces of retrieved context to answer the question. ' +
      '\n\n' +
      '{context}';

    const qaPrompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ]);

    const questionAnsweringChain = await createStuffDocumentsChain({
      llm,
      prompt: qaPrompt,
    });
    // 8. Execute the chain

    const ragChain = await createRetrievalChain({
      retriever: historyAwareRetriever,
      combineDocsChain: questionAnsweringChain,
    });

    const history = (previousMessages || []).map((message) => {
      return message.role === 'user'
        ? new HumanMessage(message.content)
        : new AIMessage(message.content);
    });

    const response = await ragChain.stream({
      input: query,
      chatHistory: history,
    });

    return new Readable({
      async read() {
        for await (const chunk of response) {
          if (chunk.answer) {
            this.push(`data: ${JSON.stringify({ content: chunk.answer })}\n\n`);
          }
        }
        this.push(null);
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
