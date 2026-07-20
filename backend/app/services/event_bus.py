import asyncio
from typing import Callable, Dict, List, Any

class EventBus:
    """
    Un EventBus simple en mémoire pour le découplage des services.
    Permet le modèle Publish/Subscribe.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    def publish(self, event_type: str, **kwargs: Any):
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                # On utilise asyncio.create_task pour ne pas bloquer le thread principal
                # si les callbacks sont async, sinon on les exécute.
                if asyncio.iscoroutinefunction(callback):
                    asyncio.create_task(callback(**kwargs))
                else:
                    callback(**kwargs)

# Instance globale
event_bus = EventBus()
