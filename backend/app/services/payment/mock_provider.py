import uuid
from typing import Dict, Any
from .base import PaymentProvider
import logging
logger = logging.getLogger(__name__)

class MockProvider(PaymentProvider):
    """Provider de test — simule un paiement immédiatement réussi."""
    
    def create_payment_intent(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        payment_id = f"mock_{uuid.uuid4().hex[:12]}"
        campaign_id = metadata.get('campaign_id', 'unknown')
        logger.info(f"[MockProvider] Création paiement {payment_id} - {amount} {currency}")
        return {
            'provider_payment_id': payment_id,
            'checkout_url': f"/api/v1/payments/mock/checkout/{payment_id}?amount={amount}&currency={currency}&campaign={campaign_id}",
        }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        return True  # Mock accepte tout
    
    def parse_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        import json
        data = json.loads(payload)
        return {
            'type': data.get('type', 'payment.success'),
            'provider_reference': data.get('event_id', f'mock_evt_{uuid.uuid4().hex[:12]}'),
            'provider_payment_id': data.get('payment_id', ''),
            'amount': float(data.get('amount', 0)),
            'currency': data.get('currency', 'TND'),
            'metadata': data.get('metadata', {}),
        }
    
    def get_payment_status(self, provider_payment_id: str) -> str:
        return 'SUCCESS'
    
    def refund_payment(self, provider_payment_id: str, amount: float, reason: str) -> Dict[str, Any]:
        return {'refund_id': f'mock_refund_{uuid.uuid4().hex[:8]}', 'status': 'SUCCESS'}
    
    def cancel_payment(self, provider_payment_id: str) -> bool:
        return True
