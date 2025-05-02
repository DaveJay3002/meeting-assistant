import axios from 'axios';
import Constants from 'expo-constants';

// API endpoint for OpenAI
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Available models in preference order
const MODELS = {
  GPT4: 'gpt-4',
  GPT3_TURBO: 'gpt-3.5-turbo',
};

class OpenAIService {
  private apiKey: string;
  private currentModel: string;

  constructor() {
    // Get API key from environment variables
    this.apiKey = Constants.expoConfig?.extra?.openAiApiKey || '';
    
    // Start with GPT-4 as default
    this.currentModel = MODELS.GPT3_TURBO;
    
    if (!this.apiKey) {
      console.warn('OpenAI API key is not set. Chat functionality will not work.');
    }
  }

  /**
   * Streams a chat completion response from OpenAI
   * 
   * @param prompt The user's message
   * @param context Additional context (e.g., meeting transcript)
   * @param onToken Callback function for each token received
   * @returns A promise that resolves when the stream is complete
   */
  async streamChatCompletion(
    prompt: string, 
    context: string, 
    onToken: (token: string) => void
  ): Promise<void> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      // Create system message with context
      const systemMessage = `You are an AI assistant helping with meeting information. 
      Use the following meeting transcript to answer the user's questions.
      Only respond based on information in the transcript.
      If the information isn't in the transcript, say so politely.
      
      Meeting Transcript:
      ${context}`;

      // Limit the context if it's too large (OpenAI has token limits)
      const truncatedContext = context.length > 15000 
        ? context.substring(0, 15000) + '... (transcript truncated)'
        : context;
      
      // Set up the request with streaming enabled
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          stream: true, // Enable streaming
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        // Try to get error details
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: { message: errorText } };
        }
        
        // Check if model is unsupported or unavailable
        const errorMsg = errorData.error?.message || response.statusText;
        if (
          (errorMsg.includes('model_not_found') || 
           errorMsg.includes('model is currently overloaded')) && 
          this.currentModel === MODELS.GPT4
        ) {
          // Fallback to GPT-3.5 Turbo
          console.log('Falling back to GPT-3.5 Turbo');
          this.currentModel = MODELS.GPT3_TURBO;
          return this.streamChatCompletion(prompt, context, onToken);
        }
        
        throw new Error(`OpenAI API error: ${errorMsg}`);
      }

      // Ensure we have a ReadableStream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get stream reader');
      }

      // Process the stream
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;
          
          // Remove 'data: ' prefix
          const data = line.replace(/^data: /, '').trim();
          
          try {
            if (data) {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              // Send token to callback if it exists
              if (content) {
                onToken(content);
              }
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat completion:', error);
      // Send error message to the user
      onToken("Sorry, I encountered an error while processing your request. Please try again later.");
      throw error;
    }
  }
}

export default new OpenAIService(); 