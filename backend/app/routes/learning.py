from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.routes.auth import get_current_user
from app.services import gemini_service, rag_service
from app.services.scraper_service import scrape_recommendations
from app.db import get_db
from bson import ObjectId
import os

router = APIRouter()

class PracticeRequest(BaseModel):
    topic: str
    difficulty: str

@router.post("/generate")
async def generate_study_content(request: PracticeRequest, current_user: dict = Depends(get_current_user)):
    try:
        # 1. Get RAG context if the user uploaded documents previously
        # For simplicity, getting all contexts globally, but usually filtered by user
        contexts = rag_service.get_contexts()
        combined_context = "\n".join([c["context"] for c in contexts])[:3000]
        
        # 2. Call Gemini
        content = await gemini_service.generate_practice_questions(
            topic=request.topic, 
            difficulty=request.difficulty, 
            rag_context=combined_context
        )
        
        # 3. Save to database
        db = get_db()
        topic_doc = {
            "userId": ObjectId(current_user["id"]),
            "title": request.topic,
            "difficulty": request.difficulty,
            "explanation": content["explanation"]
        }
        topic_res = await db.topics.insert_one(topic_doc)
        topic_id = topic_res.inserted_id
        
        for q in content["quizzes"]:
            await db.quizzes.insert_one({
                "topicId": topic_id,
                "subtopic": q.get("subtopic", "General Concepts"),
                "question": q["question"],
                "options": q["options"],
                "answer": q["answer"]
            })
            
        await db.flashcards.insert_one({
            "topicId": topic_id,
            "front": content["flashcard"]["front"],
            "back": content["flashcard"]["back"]
        })
        
        # Return the generated content right away to show on frontend
        content["topic_id"] = str(topic_id)
        return content
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_document(document: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not document:
        raise HTTPException(status_code=400, detail="No document provided")
        
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{document.filename}"
    
    with open(file_path, "wb+") as f:
        f.write(await document.read())
        
    try:
        await rag_service.parse_pdf(file_path, document.filename)
        return {"message": "Context ingested successfully via RAG"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse PDF context")

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Fetch all user topics
    topics_cursor = db.topics.find({"userId": ObjectId(current_user["id"])})
    raw_topics = []
    async for t in topics_cursor:
        t["_id"] = str(t["_id"])
        raw_topics.append(t)
        
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    progress_list = user.get("progress", [])
    
    tid_to_title = {t["_id"]: t["title"].strip().title() for t in raw_topics}
    
    from collections import defaultdict
    title_scores = defaultdict(list)
    title_subtopics = defaultdict(lambda: defaultdict(list))
    
    for p in progress_list:
        tid = str(p.get("topicId"))
        if tid in tid_to_title:
            title = tid_to_title[tid]
            score = p.get("score", 0)
            total = max(1, p.get("total", 3))
            title_scores[title].append(score / total)
            
            for st in p.get("subtopic_results", []):
                st_name = str(st.get("subtopic", "General")).title()
                st_correct = int(st.get("correct", 0))
                title_subtopics[title][st_name].append(st_correct)

    final_topics = []
    weak_areas = []

    # Map normalized title back to one of the original documents to get difficulty
    for title in list(set(tid_to_title.values())):
        avg_score = 0
        if title in title_scores and len(title_scores[title]) > 0:
            avg = sum(title_scores[title]) / len(title_scores[title])
            avg_score = int(round(avg * 100))
            
        subtopics_list = []
        if title in title_subtopics:
            for st_name, results in title_subtopics[title].items():
                st_avg = int(round((sum(results) / max(1, len(results))) * 100))
                subtopics_list.append({"name": st_name, "averageScore": st_avg})
                
        # Find difficulty text
        diff = "medium"
        for t in raw_topics:
            if t["title"].strip().title() == title:
                diff = t["difficulty"]
                break
                
        # Only include if they've taken at least one quiz for it
        if title in title_scores:
            topic_dict = {
                "title": title,
                "difficulty": diff,
                "averageScore": avg_score,
                "subtopics": sorted(subtopics_list, key=lambda x: x["averageScore"])
            }
            final_topics.append(topic_dict)
            
            if avg_score <= 75:
                weak_areas.append(topic_dict)
                
    # Sort final_topics by most recently active (arbitrarily alphabetically for now)
    final_topics = sorted(final_topics, key=lambda x: x["title"])
    
    # 4. Generate recommendations using web scraper based on weak area or most recent topic
    recommended_topics = []
    if final_topics:
        # Prioritize recommending study based on weak areas, else the last taken topic
        target_topic = weak_areas[0]["title"] if weak_areas else final_topics[-1]["title"]
        
        scraped_recs = scrape_recommendations(target_topic)
        for rec in scraped_recs:
            recommended_topics.append({
                "sourceTopic": target_topic,
                "recommendation": rec
            })
            
    return {"topics": final_topics, "weak_areas": weak_areas, "recommended_topics": recommended_topics}

class QuizSubmission(BaseModel):
    topic_id: str
    score: int
    total: int = 3
    subtopic_results: List[dict] = []
    
@router.post("/submit-quiz")
async def submit_quiz(submission: QuizSubmission, current_user: dict = Depends(get_current_user)):
    db = get_db()
    import datetime
    
    progress = {
        "topicId": ObjectId(submission.topic_id),
        "score": submission.score,
        "total": submission.total,
        "subtopic_results": submission.subtopic_results,
        "completedAt": datetime.datetime.utcnow()
    }
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$push": {"progress": progress}}
    )
    
    return {"message": "Progress recorded successfully"}

@router.get("/resources")
async def get_resources(topic: str, current_user: dict = Depends(get_current_user)):
    from app.services.scraper_service import scrape_youtube_videos
    videos = scrape_youtube_videos(topic)
    return {"topic": topic, "videos": videos}

@router.get("/recommendations")
async def get_recommendations(topic: str, current_user: dict = Depends(get_current_user)):
    from app.services.scraper_service import scrape_recommendations
    recs = scrape_recommendations(topic)
    return {"recommendations": recs}

@router.delete("/delete-topic")
async def delete_topic(topic: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = ObjectId(current_user["id"])
    
    # Find all topic IDs matching the normalized title for this user
    topics_cursor = db.topics.find({"userId": user_id})
    target_ids = []
    async for t in topics_cursor:
        if t["title"].strip().title() == topic.strip().title():
            target_ids.append(t["_id"])
            
    if not target_ids:
        return {"message": "Topic not found"}
        
    # Remove progress entries from user document
    await db.users.update_one(
        {"_id": user_id},
        {"$pull": {"progress": {"topicId": {"$in": target_ids}}}}
    )
    
    # Clean up associated records
    await db.topics.delete_many({"_id": {"$in": target_ids}})
    await db.quizzes.delete_many({"topicId": {"$in": target_ids}})
    await db.flashcards.delete_many({"topicId": {"$in": target_ids}})
    
    return {"message": f"Deleted all data for topic: {topic}"}
