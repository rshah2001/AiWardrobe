import axios from 'axios';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateOutfitRecommendation(
  weather: any,
  wardrobeItems: any[],
  occasion?: string
): Promise<string> {
  try {
    const systemPrompt = `You are a helpful fashion assistant that provides outfit recommendations based on weather conditions and available wardrobe items. Be specific, practical, and friendly.`;
    
    let userPrompt = `Current weather: ${weather.temp}°C, ${weather.description}, humidity: ${weather.humidity}%, wind: ${weather.wind_speed} km/h.`;
    
    if (occasion) {
      userPrompt += ` I need an outfit for ${occasion}.`;
    }
    
    userPrompt += ` Here are my available wardrobe items: ${JSON.stringify(wardrobeItems)}. Suggest a complete outfit from these items that would be suitable for the current weather.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating outfit recommendation:', error);
    return 'Sorry, I could not generate an outfit recommendation at this time. Please try again later.';
  }
}

export async function getStyleAdvice(
  item: any,
  userQuestion: string
): Promise<string> {
  try {
    const systemPrompt = `You are a knowledgeable fashion stylist who provides helpful advice about clothing items. Be friendly, concise, and offer practical suggestions.`;
    
    const userPrompt = `I have this item: ${JSON.stringify(item)}. ${userQuestion}`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 250,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error getting style advice:', error);
    return 'Sorry, I could not provide style advice at this time. Please try again later.';
  }
}