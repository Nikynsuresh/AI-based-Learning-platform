🚀 AI-Based Personalized Learning Platform
An AI-powered intelligent learning platform that adapts to each student’s learning style and weak areas.
The system integrates Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and real-time knowledge extraction to deliver personalized explanations, quizzes, and study plans.

This platform transforms traditional learning into a smart, adaptive, and AI-driven educational experience.

⸻

🧠 Key Features

🤖 AI Tutor

Ask questions and receive clear, personalized explanations powered by AI.

📚 Personalized Learning Paths

The platform analyzes user performance and automatically generates learning plans based on weak areas.

📄 PDF Knowledge Integration

Upload textbooks or notes and allow the AI to answer questions directly from your documents.

🔎 Retrieval-Augmented Generation (RAG)

Combines AI with document retrieval to produce accurate, context-aware answers.

🌐 Educational Web Scraping

Fetches relevant learning resources from educational websites to enhance responses.

🧪 Auto Quiz Generation

Generates practice quizzes to test understanding and reinforce learning.

📊 Learning Progress Tracking

Tracks user interactions and identifies knowledge gaps.

🔐 Secure Authentication

Implements JWT-based authentication with encrypted password storage.

⸻
🏗️ Tech Stack

Backend
	•	Python
	•	FastAPI
	•	MongoDB (Motor)
	•	Google Gemini AI
	•	RAG Architecture
	•	PyPDF
	•	JWT Authentication
	•	Passlib / Bcrypt

⸻

Frontend
	•	React 19
	•	Vite
	•	Framer Motion
	•	Lucide React
	•	React Router

⸻

⚙️ System Architecture
User (React Frontend)
        │
        ▼
FastAPI Backend
        │
        ├── Authentication Service (JWT)
        ├── AI Tutor (Gemini AI)
        ├── RAG Context Builder
        ├── PDF Processing (PyPDF)
        ├── Web Scraper Service
        │
        ▼
MongoDB Database
(User data, learning history, metadata)
📂 Project Structure:
AI-based-Learning-platform
│
├── backend
│   ├── app
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   └── db.py
│   │
│   ├── main.py
│   └── requirements.txt
│
└── frontend
    ├── src
    │   ├── components
    │   ├── pages
    │   └── main.jsx
    │
    └── package.json
🔄 Workflow

1️⃣ Authentication
	•	User logs in or signs up
	•	Password verified using Bcrypt
	•	JWT token generated for secure sessions

2️⃣ AI Learning System
	1.	User asks a question
	2.	RAG retrieves relevant knowledge
	3.	Gemini AI generates explanation or quiz
	4.	Interaction stored to track weak areas

3️⃣ Knowledge Integration
	•	Upload PDFs
	•	Extract text using PyPDF
	•	Index documents for RAG
	•	AI answers questions using uploaded content
🎯 Future Improvements
	•	Vector database integration (FAISS / Pinecone)
	•	Voice-based AI tutor
	•	Mobile application
	•	AI-powered exam preparation mode
	•	Real-time collaborative learning

⸻

💡 Vision

The goal of this project is to create an intelligent AI tutor that adapts to every learner, making education more personalized, efficient, and accessible.
