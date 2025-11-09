// Utility for OpenAI Text-to-Speech with Shimmer voice
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

export async function textToSpeech(text) {
  try {
    console.log('Converting text to speech with Shimmer voice');
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // HD model for more natural sound
        voice: 'shimmer', // Shimmer voice - warm, expressive, energetic, perfect for sassy personality
        input: text,
        speed: 1.00 // Slightly slower for more relaxed, natural delivery
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS Error:', errorText);
      return null;
    }

    // Get the audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    
    // Create a file URI for the audio - use proper file path
    const fileName = `aura_voice_${Date.now()}.mp3`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: 'base64',
    });
    
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    console.log('Audio file created:', fileUri);
    console.log('File exists:', fileInfo.exists, 'Size:', fileInfo.size);
    
    return fileUri;

  } catch (error) {
    console.error('Error in textToSpeech:', error);
    return null;
  }
}

// Background sound contexts - maps what Aura might be doing to sound files
export const BACKGROUND_SOUNDS = {
  cafe: 'coffee_shop_ambience',
  party: 'party_sounds',
  home: 'home_ambience',
  shopping: 'mall_ambience',
  rain: 'rain_sounds',
  outside: 'outdoor_ambience',
  gym: 'gym_sounds',
  default: null
};

// Detect context from Aura's message to determine background sound
export function detectBackgroundSound(messageText) {
  const lowerText = messageText.toLowerCase();
  
  if (lowerText.includes('coffee') || lowerText.includes('café') || lowerText.includes('cafe') || lowerText.includes('starbucks')) {
    return BACKGROUND_SOUNDS.cafe;
  }
  if (lowerText.includes('party') || lowerText.includes('club') || lowerText.includes('dancing')) {
    return BACKGROUND_SOUNDS.party;
  }
  if (lowerText.includes('home') || lowerText.includes('couch') || lowerText.includes('bed') || lowerText.includes('chill')) {
    return BACKGROUND_SOUNDS.home;
  }
  if (lowerText.includes('shop') || lowerText.includes('mall') || lowerText.includes('store')) {
    return BACKGROUND_SOUNDS.shopping;
  }
  if (lowerText.includes('rain') || lowerText.includes('storm') || lowerText.includes('weather')) {
    return BACKGROUND_SOUNDS.rain;
  }
  if (lowerText.includes('gym') || lowerText.includes('workout') || lowerText.includes('exercise')) {
    return BACKGROUND_SOUNDS.gym;
  }
  if (lowerText.includes('outside') || lowerText.includes('walk') || lowerText.includes('park')) {
    return BACKGROUND_SOUNDS.outside;
  }
  
  return BACKGROUND_SOUNDS.default;
}
