import asyncio
from typing import Dict, Any

class ModerationService:
    @staticmethod
    async def moderate_text(text: str) -> Dict[str, Any]:
        """
        Simule l'appel à l'IA pour la modération du texte.
        Retourne un payload: { "decision": "ALLOW" | "BLOCK", "risk": int, "reason": str }
        """
        # Dans un vrai scénario, appel à Groq/Llama3
        await asyncio.sleep(0.5)
        
        lower_text = text.lower()
        if "06" in text or "whatsapp" in lower_text or "07" in text:
            return {
                "decision": "BLOCK",
                "risk": 95,
                "reason": "Détection potentielle de numéro de téléphone ou de WhatsApp"
            }
        
        if "idiot" in lower_text or "nul" in lower_text:
            return {
                "decision": "BLOCK",
                "risk": 80,
                "reason": "Langage inapproprié"
            }
            
        return {
            "decision": "ALLOW",
            "risk": 5,
            "reason": "OK"
        }
