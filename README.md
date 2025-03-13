# AI Wardrobe: Smart Outfit Recommendation App

## Project Overview
AI Wardrobe is an intelligent mobile application that helps users create the perfect outfit by combining real-time weather insights, personal wardrobe management, and AI-powered recommendations.

## Project Structure
```
ai-wardrobe/
├── app/
│   └── (tabs)/
│       ├── index.tsx           # Home screen
│       ├── wardrobe.tsx        # Wardrobe management
│       ├── weather.tsx         # Weather information
│       └── profile.tsx         # User profile
├── components/
│   ├── WeatherWidget.tsx       # Weather display component
│   ├── CameraComponent.tsx     # Wardrobe item scanning
│   └── OutfitRecommendation.tsx # AI-powered outfit suggestions
├── lib/
│   ├── supabase.ts             # Supabase configuration
│   ├── weatherStore.ts         # Weather data management
│   └── wardrobeStore.ts        # Wardrobe item management
├── stores/
│   └── aiStore.ts              # AI recommendation store
└── package.json                # Project dependencies
```

## Key Features
- 🌤️ Real-time Weather-based Outfit Suggestions
- 👗 Personal Wardrobe Management
- 🤖 AI-Powered Style Recommendations
- 📸 Wardrobe Item Scanning
- 👗 Occasion-based Outfit Planning

## Prerequisites
- Node.js (v16+)
- npm or Yarn
- Expo CLI
- Smartphone or Emulator

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/rshah2001/AiWardrobe.git
   cd AiWardrobe
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```

## Running the App
```bash
expo start
```

## Technologies Used
- React Native
- Expo
- TypeScript
- Supabase
- OpenAI API
- OpenWeather API
- TensorFlow.js
- Zustand (State Management)

## Future Roadmap
- [ ] Enhanced AI Fashion Recommendations
- [ ] Social Sharing Features
- [ ] Machine Learning Wardrobe Optimization
- [ ] Integration with Online Shopping Platforms

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the MIT License.

## Contact
Rishil Shah -Rishil1211@icloud.com

Project Link: [https://github.com/rshah2001/AiWardrobe](https://github.com/rshah2001/AiWardrobe)
