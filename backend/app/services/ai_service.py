import os
import subprocess
import json
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            # Groq est 100% compatible avec le SDK OpenAI !
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://api.groq.com/openai/v1"
            )
        else:
            self.client = None

    async def process_video(self, video_path: str) -> dict:
        """
        1. Extrait l'audio avec FFmpeg.
        2. Transcrit l'audio avec Whisper sur Groq.
        3. Génère des mots-clés avec Llama 3 sur Groq.
        """
        if not self.client:
            logger.warning("GROQ_API_KEY non configurée. Simulation IA active.")
            return {
                "transcription": "Transcription simulée car l'API n'est pas configurée.",
                "tags": ["simulation", "ia", "test"]
            }
            
        audio_path = video_path.rsplit(".", 1)[0] + ".mp3"
        
        try:
            # 1. Extraction Audio avec FFmpeg
            subprocess.run([
                "ffmpeg", "-y", "-i", video_path, 
                "-q:a", "0", "-map", "a", audio_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 2. Transcription via Whisper (Groq)
            with open(audio_path, "rb") as audio_file:
                transcription_response = await self.client.audio.transcriptions.create(
                    file=(os.path.basename(audio_path), audio_file.read()),
                    model="whisper-large-v3",
                    response_format="json",
                    language="fr"
                )
            
            transcription_text = transcription_response.text
            
            # 3. Génération de mots-clés via Llama 3 (Groq)
            prompt = (
                f"Voici la transcription d'une vidéo : \"{transcription_text}\"\n"
                "Génère une liste de 5 mots-clés pertinents basés sur ce texte.\n"
                "Formate ta réponse EXACTEMENT en JSON comme ceci, sans texte autour :\n"
                '{"tags": ["mot1", "mot2", "mot3", "mot4", "mot5"]}'
            )
            
            chat_response = await self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = chat_response.choices[0].message.content.strip()
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].strip()
                
            try:
                result = json.loads(content)
                return {
                    "transcription": transcription_text,
                    "tags": result.get("tags", [])
                }
            except json.JSONDecodeError:
                return {
                    "transcription": transcription_text,
                    "tags": ["Erreur_Format"]
                }
                
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse IA par Groq : {str(e)}")
            return {"transcription": f"L'analyse IA a échoué : {str(e)}", "tags": []}
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)

ai_service = AIService()
