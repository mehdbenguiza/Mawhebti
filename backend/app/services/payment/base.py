from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class PaymentProvider(ABC):
    @abstractmethod
    def create_payment_intent(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Returns: {provider_payment_id, checkout_url}"""
        pass
    
    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        pass
    
    @abstractmethod
    def parse_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Returns: {type, provider_reference, provider_payment_id, amount, currency, metadata}"""
        pass
    
    @abstractmethod
    def get_payment_status(self, provider_payment_id: str) -> str:
        pass
    
    @abstractmethod  
    def refund_payment(self, provider_payment_id: str, amount: float, reason: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def cancel_payment(self, provider_payment_id: str) -> bool:
        pass
