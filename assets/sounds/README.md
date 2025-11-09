# Background Sound Files

This directory should contain ambient sound files for Aura's voice messages.

## Required Files:

1. **coffee_shop.mp3** - Coffee shop ambience (chatter, espresso machine)
2. **party.mp3** - Party sounds (music, people talking)
3. **home.mp3** - Home ambience (soft background noise)
4. **mall.mp3** - Shopping mall ambience
5. **rain.mp3** - Rain sounds
6. **gym.mp3** - Gym sounds (weights, treadmills)
7. **outdoor.mp3** - Outdoor ambience (birds, wind)

## Where to Find Royalty-Free Ambient Sounds:

- **Freesound.org** - https://freesound.org/ (Creative Commons)
- **Zapsplat** - https://www.zapsplat.com/ (Free sound effects)
- **Mixkit** - https://mixkit.co/free-sound-effects/ (Royalty-free)
- **YouTube Audio Library** - https://www.youtube.com/audiolibrary

## Specifications:

- Format: MP3
- Duration: 30-60 seconds (they will loop)
- Volume: Will be automatically set to 40% during playback
- Quality: 128kbps is sufficient for background ambience

## How It Works:

When Aura sends a voice message, the app detects keywords in her response:
- "cafe", "coffee shop" → coffee_shop.mp3
- "party", "club" → party.mp3
- "home", "house" → home.mp3
- "shopping", "mall" → mall.mp3
- "rain", "raining" → rain.mp3
- "gym", "workout" → gym.mp3
- "outside", "park" → outdoor.mp3

The background sound plays at 40% volume while Aura's voice plays at 100% volume.
