import os
import subprocess
import json
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def process_video(self, video_path: str) -> dict:
        """
        Extrait l'audio de la vidéo avec FFmpeg et le transcrit via Whisper API.
        Puis utilise GPT pour générer des mots-clés.
        """
        if not self.client:
            logger.warning("OPENAI_API_KEY non configurée. L'analyse IA est simulée.")
            return {
                "transcription": "Transcription simulée car l'API OpenAI n'est pas configurée.", 
                "tags": ["simulation", "ia", "test"]
            }
            
        audio_path = video_path.rsplit(".", 1)[0] + ".mp3"
        
        try:
            # 1. Extraction Audio avec FFmpeg
            # On demande à ffmpeg d'extraire la piste audio en mp3
            subprocess.run([
                "ffmpeg", "-y", "-i", video_path, 
                "-q:a", "0", "-map", "a", audio_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 2. Transcription Whisper
            with open(audio_path, "rb") as audio_file:
                transcript_response = await self.client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file,
                    language="fr" # On force le français pour de meilleurs résultats par défaut
                )
            transcription = transcript_response.text
            
            # 3. Extraction des Tags avec GPT
            prompt = f"Analyse cette transcription d'une vidéo de talent et retourne un tableau JSON de 5 mots-clés pertinents (uniquement le tableau, pas de texte autour) :\n\n{transcription}"
            chat_response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = chat_response.choices[0].message.content or "[]"
            
            # Nettoyage rudimentaire si GPT ajoute du texte autour du JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].strip()
                
            try:
                tags = json.loads(content)
                if not isinstance(tags, list):
                    tags = []
            except json.JSONDecodeError:
                tags = []
                
            return {"transcription": transcription, "tags": tags}
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse IA : {str(e)}")
            return {"transcription": "L'analyse IA a échoué (vidéo sans son ou erreur API).", "tags": []}
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)

ai_service = AIService()
