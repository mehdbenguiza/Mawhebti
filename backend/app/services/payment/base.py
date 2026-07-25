from abc import ABC, abstractmethod
from typing import Dict, Any

class PaymentProvider(ABC):
    @abstractmethod
    def create_payment_intent(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a payment intent and returns the provider_payment_id and checkout_url if applicable.
        Should return a dictionary containing:
        - provider_payment_id (str)
        - checkout_url (str, optional)
        """
        pass
        
    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verifies the webhook signature"""
        pass
        
    @abstractmethod
    def parse_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """
        Parses a webhook event and returns a standardized dictionary of the event data.
        Should return a dictionary containing:
        - type (str): The event type (e.g. 'payment_intent.succeeded')
        - data (Any): The raw data object
        - provider_reference (str): The unique event ID for idempotency
        """
        pass
