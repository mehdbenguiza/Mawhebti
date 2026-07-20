import os
import subprocess
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None

    async def process_video(self, video_path: str) -> dict:
        """
        Extrait l'audio avec FFmpeg, l'envoie à Gemini 1.5,
        et lui demande la transcription ET l'extraction de tags en 1 seule requête !
        """
        if not self.model:
            logger.warning("GEMINI_API_KEY non configurée. Simulation IA active.")
            return {
                "transcription": "Transcription simulée car l'API Gemini n'est pas configurée.",
                "tags": ["simulation", "ia", "test"]
            }
            
        audio_path = video_path.rsplit(".", 1)[0] + ".mp3"
        uploaded_file = None
        
        try:
            # 1. Extraction Audio avec FFmpeg
            subprocess.run([
                "ffmpeg", "-y", "-i", video_path, 
                "-q:a", "0", "-map", "a", audio_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 2. Upload sur l'API Gemini (File API)
            uploaded_file = genai.upload_file(path=audio_path)
            
            # 3. Prompt multi-modal : Audio + Texte
            prompt = (
                "Écoute cet audio. Fais deux choses de manière stricte :\n"
                "1. Transcris fidèlement tout ce qui est dit en texte (en français par défaut).\n"
                "2. Génère une liste de 5 mots-clés (tags) pertinents basés sur le contenu.\n"
                "Formate ta réponse EXACTEMENT en format JSON valide comme l'exemple suivant, sans aucun bloc Markdown (```) ni texte avant ou après :\n"
                '{"transcription": "le texte ici...", "tags": ["mot1", "mot2", "mot3", "mot4", "mot5"]}'
            )
            
            # 4. Requête à Gemini
            response = await self.model.generate_content_async([prompt, uploaded_file])
            
            content = response.text.strip()
            
            # Nettoyage JSON si Gemini ajoute quand même des blocs Markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].strip()
                
            try:
                result = json.loads(content)
                return {
                    "transcription": result.get("transcription", "Aucune transcription trouvée."),
                    "tags": result.get("tags", [])
                }
            except json.JSONDecodeError:
                return {
                    "transcription": content,
                    "tags": ["Erreur_Format_JSON"]
                }
                
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse IA par Gemini : {str(e)}")
            return {"transcription": f"L'analyse IA a échoué : {str(e)}", "tags": []}
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)
            if uploaded_file:
                try:
                    uploaded_file.delete()
                except:
                    pass

ai_service = AIService()
