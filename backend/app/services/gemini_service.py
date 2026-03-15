import os
import json
from google import genai

def get_ai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key != 'fake-api-key':
        return genai.Client(api_key=api_key)
    return None

async def generate_practice_questions(topic: str, difficulty: str, rag_context: str = ""):
    prompt = f"""
    You are an AI Tutor.
    Topic: {topic}
    Difficulty: {difficulty}
    Context Information from uploaded docs: {rag_context}
    
    Please provide:
    1. A short explanation suited for the difficulty level.
    2. 2-3 multiple choice quiz questions with 4 options and the correct answer for each. Specifically identify the specific narrowed down 'subtopic' each question tests (e.g. "Linear Regression" within "Machine Learning").
    3. A flashcard (front and back).
    
    Respond STRICTLY in JSON format matching this structure:
    {{
        "explanation": "your explanation string",
        "quizzes": [
            {{
                "subtopic": "a short 2-3 word string classifying the subtopic of this question",
                "question": "question string",
                "options": ["A", "B", "C", "D"],
                "answer": "correct string exactly matching one option"
            }}
        ],
        "flashcard": {{
            "front": "front text",
            "back": "back text"
        }}
    }}
    """
    
    client = get_ai_client()
    
    if not client:
        return {
            "explanation": f"Using Python mock simulated {difficulty} explanation for {topic}. Add GEMINI_API_KEY to truly generate.",
            "quizzes": [
                {
                    "subtopic": f"Basic concepts of {topic}",
                    "question": f"What is 1 + 1 in the context of {topic}?",
                    "options": ['1', '2', '3', '4'],
                    "answer": '2'
                }
            ],
            "flashcard": {
                "front": f"What is {topic}?",
                "back": "A dynamic concept."
            }
        }

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_text)
        
    except Exception as e:
        print(f"Gemini DB Error: {e}")
        raise Exception("Failed to contact Gemini API")
