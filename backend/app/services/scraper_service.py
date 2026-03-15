import requests
from bs4 import BeautifulSoup
import urllib.parse
import re

def scrape_recommendations(topic_name: str) -> list[str]:
    """
    Scrapes Wikipedia for related topics based on the current topic.
    Provides up to 4 recommendations for what to learn next.
    """
    if not topic_name:
        return []
        
    # Replace spaces with underscores for wikipedia URLs
    safe_topic = urllib.parse.quote(topic_name.title().replace(' ', '_'))
    url = f"https://en.wikipedia.org/wiki/{safe_topic}"
    
    try:
        response = requests.get(url, timeout=5)
        # If the direct URL misses, we might fallback to basic generated ones
        if response.status_code != 200:
            return [f"Advanced {topic_name}", f"Applications of {topic_name}", f"History of {topic_name}", f"{topic_name} Architecture"]
            
        soup = BeautifulSoup(response.text, 'html.parser')
        recommendations = []
        
        # 1. Attempt to find the "See also" section, which typically links directly to related subjects
        see_also = soup.find(id='See_also')
        if see_also and see_also.parent:
            ul = see_also.parent.find_next_sibling('ul')
            if ul:
                for a in ul.find_all('a'):
                    title = a.get('title')
                    if title and not ":" in title:
                        recommendations.append(title)
                        
        # 2. If not enough links, heavily scrape from intro paragraphs
        if len(recommendations) < 4:
            for p in soup.find_all('p', limit=6):
                for a in p.find_all('a'):
                    title = a.get('title')
                    if title and not ":" in title and title.lower() != topic_name.lower():
                        if title not in recommendations:
                            recommendations.append(title)
                            
        # Output limits and cleaning
        final_recs = []
        for rec in recommendations:
            if rec.title() not in final_recs and len(rec) > 3:
                final_recs.append(rec.title())
            if len(final_recs) >= 4:
                break
                
        if not final_recs:
            return [f"Advanced {topic_name}", f"Applications of {topic_name}"]
            
        return final_recs
        
    except Exception as e:
        print(f"Scraper error for {topic_name}: {e}")
        return [f"Advanced {topic_name}", f"Applications of {topic_name}", f"{topic_name} Systems"]

def scrape_youtube_videos(topic_name: str) -> list[dict]:
    """Scrapes YouTube search to find direct video links for a topic"""
    if not topic_name:
        return []
        
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(topic_name + ' crash course tutorial')}"
    # Impersonate a regular browser so YouTube sends back the required initial HTML
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        
        # YouTube embeds the first 20-30 videos in window["ytInitialData"] directly in the HTML.
        # We can extract the video IDs by looking for "videoId":"(11 chars)"
        video_ids = re.findall(r'"videoId":"([^"]{11})"', response.text)
        
        # Filter out duplicates and grab top 4
        unique_ids = []
        for vid in video_ids:
            if vid not in unique_ids:
                unique_ids.append(vid)
                
        results = []
        for vid in unique_ids[:4]:
            results.append({
                "title": f"Educational Lesson: {topic_name.title()}",
                "url": f"https://www.youtube.com/watch?v={vid}",
                "thumbnail": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"
            })
            
        return results
    except Exception as e:
        print(f"YT Scraper error: {e}")
        return []
