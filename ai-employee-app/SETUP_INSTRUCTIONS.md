# AI Worker Plus Setup Instructions

## 📦 What's Included

This repository contains the complete AI Worker Plus React application with all features:
- Voice-activated AI assistant with name-based activation
- Long-running task system with progress tracking
- Cloud sync and memory features
- Developer specialist template
- Modern dark theme UI/UX design
- Comprehensive documentation

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/patriotnewsactivism/AI-Worker-Plus.git
cd AI-Worker-Plus
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Application
Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 4: Get Your Gemini API Key
1. Visit https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key
5. In the app, click the settings icon (⚙️) and paste your API key

## 📤 Pushing Updates to GitHub

If you make changes and want to push them back to your repository:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
AI-Worker-Plus/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Modern styling
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md           # Documentation
```

## ✨ Key Features

### Voice Commands
- Click the microphone icon (🎤) to enable listening
- Say the AI's name (configurable in settings) followed by your request
- Example: "Assistant, help me write a React component"
- Visual feedback shows listening and processing states

### Long-Running Tasks
- Select the "Long Task" template
- Click the Play button (▶️) to start extended processing
- Monitor progress with the visual progress bar
- Click Stop (⏹️) to cancel tasks at any time

### Memory Bank
- Automatically captures important information from conversations
- Helps with organizational/memory issues
- Time-stamped entries for easy reference
- Access via the left panel

### Developer Mode
- Use the "Developer" template for coding tasks
- AI can create apps, websites, and solve programming challenges
- Supports React, JavaScript, HTML/CSS, Node.js, Python
- Customizable skill set in settings

## 🔒 Security Notes

- API keys are stored locally in browser localStorage
- No data is sent to external servers except Gemini API
- All conversations are client-side only
- Voice data is processed locally through browser Web Speech API

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Voice commands work on mobile browsers (Chrome, Safari, Edge recommended)
- Optimized for both portrait and landscape orientations

## 🐛 Troubleshooting

### Installation Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Voice Recognition Not Working
- Use Chrome, Edge, or Safari (Firefox has limited support)
- Check microphone permissions in browser settings
- Ensure HTTPS or localhost (required for Web Speech API)
- Restart the browser if issues persist

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### API Key Issues
- Verify your key at https://aistudio.google.com/apikey
- Ensure you haven't exceeded quota limits
- Check that the key is properly copied to settings

## 🎯 Pro Tips

1. **Customize Your AI**: Set a unique name in settings for better voice recognition
2. **Developer Skills**: Add specific skills to your Developer AI for more targeted help
3. **Memory Bank**: Check the memory bank regularly for important recorded information
4. **Long Tasks**: Use the long task system for processing that can run in the background
5. **Templates**: Switch between templates for different types of AI assistance

## 📊 Stats Tracking

The application tracks:
- **Messages**: Total conversation count
- **Words**: AI-generated word count
- **Time**: Session duration in minutes

## 🎨 Modern UI Features

- Sleek dark theme with gradient accents
- Clean, minimalist interface design
- Smooth animations and transitions
- Responsive layout for all devices
- Intuitive workflow and navigation

## 🤝 Contributing

If you'd like to contribute to this project:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Need more help?** Check the README.md file or open an issue on GitHub.