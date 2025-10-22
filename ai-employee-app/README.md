# AI Employee Creator Pro - React App

A modern, feature-rich React application for creating and interacting with custom AI assistants powered by Google's Gemini API.

## 🚀 Features

### Core Functionality
- **Custom AI Personas**: Define role, skills, instructions, and tone for your AI assistant
- **Real-time Chat Interface**: Smooth, responsive chat experience with markdown support
- **Quick Templates**: Pre-built configurations for common roles (Assistant, Researcher, Analyst, Creative, Developer)
- **Message Templates**: Quick-insert templates for common tasks
- **Skill Tags**: Visual skill management with add/remove functionality

### Advanced Features
- **Session Statistics**: Track messages, word count, and session time
- **Configuration Management**: Save and load AI employee configurations
- **Export Options**: Copy conversations or export as JSON
- **API Key Management**: Secure storage of Gemini API key in localStorage
- **Markdown Support**: Rich text formatting in AI responses
- **Typing Indicators**: Visual feedback when AI is processing
- **Error Handling**: User-friendly error messages

### Voice Command Features
- **Always Listening AI**: The AI continuously listens to conversations in the background
- **Name-based Activation**: Only responds when directly addressed by name
- **Memory Assistance**: Records important information automatically for organizational help
- **Voice Processing Indicators**: Visual feedback when processing voice commands

### Developer Features
- **Coding Specialist Template**: Pre-configured AI employee for software development tasks
- **Long-running Tasks**: Start and monitor extended AI processing jobs
- **Progress Tracking**: Visual progress bar for long-running tasks
- **Task Management**: Start, stop, and monitor AI tasks without constant supervision

### Cloud & Memory Features
- **Automatic Cloud Sync**: Conversation history syncs to cloud storage (simulated)
- **Memory Bank**: Stores important information for later reference
- **Efficient Storage**: Compresses data to minimize storage footprint
- **Sync Status Indicators**: Visual feedback on cloud synchronization status

### UI/UX
- **Modern Design**: Beautiful gradient backgrounds with glass morphism effects
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Polished transitions and micro-interactions
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line
- **Auto-scroll**: Automatically scrolls to latest messages

## 🛠️ Technology Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Lucide React**: Beautiful icon library
- **Marked**: Markdown parsing for AI responses
- **React Speech Recognition**: Voice command functionality
- **React Hot Toast**: Beautiful notifications
- **CSS3**: Custom styling with gradients and animations
- **Google Gemini API**: AI-powered responses

## 📦 Installation

```bash
# Clone or navigate to the project directory
cd ai-employee-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 Getting Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key
5. In the app, click the settings icon in the chat header
6. Paste your API key and click save

## 💡 Usage

### Creating an AI Employee

1. **Choose a Template** (Optional):
   - Click one of the quick template buttons (Assistant, Researcher, Analyst, Creative, Developer)
   - Or manually configure from scratch

2. **Configure Your AI**:
   - **AI Name**: Set a name for your AI employee (e.g., "Assistant", "Jarvis")
   - **Role/Job Title**: Define the AI's primary role (e.g., "Legal Research Assistant")
   - **Key Skills**: Add relevant skills (press Enter or click + to add as tags)
   - **Core Instructions**: Provide detailed persona instructions
   - **Response Tone**: Select the communication style (Professional, Friendly, Casual, Formal, Creative)

3. **Save Configuration** (Optional):
   - Click "Save" to store your configuration for future use
   - Click "Load" to restore a previously saved configuration

### Voice Commands

1. **Enable Listening**: Click the microphone icon in the chat header
2. **Speak Naturally**: The AI will listen to all conversation
3. **Get Addressed**: Only respond when you say the AI's name
4. **Memory Help**: Important information is automatically recorded

### Chatting with Your AI Employee

1. **Enter Your Message**: Type in the chat input area
2. **Use Quick Templates**: Click template buttons for common request types
3. **Send Message**: Click the send button or press Enter
4. **Continue Conversation**: Click "Continue" to keep the conversation going
5. **Clear Chat**: Click "Clear" to start a new conversation

### Long-running Tasks

1. **Describe Task**: Enter a detailed task description
2. **Click Play Icon**: Start the long-running task
3. **Monitor Progress**: Watch the progress bar update
4. **Stop if Needed**: Click "Stop" to halt the task

### Managing Conversations

- **Copy**: Copy the entire conversation to clipboard
- **Export**: Download conversation as JSON with metadata
- **Statistics**: View real-time stats (messages, words, session time)
- **Memory Bank**: Access automatically recorded information

## 🎨 Customization

### Modifying Templates

Edit the `templates` object in `src/App.jsx`:

```javascript
const templates = {
  yourTemplate: {
    role: 'Your Role',
    skills: 'Skill 1, Skill 2',
    instructions: 'Your instructions here'
  }
};
```

### Changing Colors

Modify CSS variables in `src/App.css`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --purple-600: #7c3aed;
  /* Add more custom colors */
}
```

### Adding Message Templates

Edit the `messageTemplates` object in `src/App.jsx`:

```javascript
const messageTemplates = {
  yourTemplate: 'Your template text here'
};
```

## 📱 Responsive Design

The app is fully responsive with breakpoints at:
- **Desktop**: 1024px and above (2-column layout)
- **Tablet**: 768px - 1023px (single column)
- **Mobile**: Below 768px (optimized for small screens)

## 🔒 Security & Privacy

- API keys are stored locally in browser localStorage
- No data is sent to external servers except Gemini API
- All conversations are client-side only
- Clear browser data to remove stored configurations
- Voice data is processed locally (no external recording)

## 🚀 Deployment

### Vercel
```bash
npm run build
# Deploy the 'dist' folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy the 'dist' folder to Netlify
```

### GitHub Pages
```bash
npm run build
# Deploy the 'dist' folder to GitHub Pages
```

## 🐛 Troubleshooting

### API Key Issues
- Ensure your API key is valid and active
- Check that you have API quota remaining
- Verify the key is properly saved (click settings icon)

### Voice Recognition Issues
- Ensure you're using a supported browser (Chrome, Edge, Safari)
- Check that your microphone is enabled and working
- Verify that you've granted microphone permissions

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Styling Issues
- Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Lucide React for beautiful icons
- Marked for markdown parsing
- React Speech Recognition for voice capabilities
- Vite for blazing fast development

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review the code comments

---

**Built with ❤️ using React and Gemini AI**