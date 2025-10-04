# DivHacks-2025

## Project Outline

This is a full-stack web application for DivHacks-2025, featuring a React frontend, Python backend, and AI integration via LangChain. The MVP includes basic CRUD operations for managing AI-generated content.

### Tech Stack
- **Frontend**: React (set up with Vite)
- **Backend**: Python with FastAPI
- **AI**: LangChain (using OpenAI API for text generation)
- **Database**: In-memory storage for MVP (can be upgraded to SQLite or PostgreSQL later)

### Features
- **Create**: Add new prompts for AI generation
- **Read**: View a list of prompts and their AI-generated responses
- **Update**: Edit existing prompts and regenerate responses
- **Delete**: Remove prompts and responses
- **AI Generation**: Use LangChain to generate responses based on user prompts

### Project Structure
```
/DivHacks-2025
├── frontend/          # React application
├── backend/           # Python FastAPI server
└── README.md          # This file
```

### Setup Instructions
1. **Backend Setup**:
   - Navigate to `backend/` directory
   - Install dependencies: `pip install -r requirements.txt`
   - Run the server: `uvicorn main:app --reload`

2. **Frontend Setup**:
   - Navigate to `frontend/` directory
   - Install dependencies: `npm install`
   - Run the app: `npm run dev`

3. **Environment Variables**:
   - For backend, create a `.env` file with your OpenAI API key: `OPENAI_API_KEY=your_key_here`

### API Endpoints
- `GET /prompts`: Retrieve all prompts
- `POST /prompts`: Create a new prompt
- `PUT /prompts/{id}`: Update a prompt
- `DELETE /prompts/{id}`: Delete a prompt
- `POST /generate/{id}`: Generate AI response for a prompt

### Next Steps
- Implement user authentication
- Add database persistence
- Enhance UI/UX
- Deploy to cloud