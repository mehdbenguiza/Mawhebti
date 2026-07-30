import uuid, requests
from typing import Dict, Any
from .base import PaymentProvider
import logging
logger = logging.getLogger(__name__)

FLOUCI_BASE_URL = "https://developers.flouci.com/api"

class FlouciProvider(PaymentProvider):
    def __init__(self, app_token: str = '', app_secret: str = ''):
        self.app_token = app_token
        self.app_secret = app_secret
    
    def create_payment_intent(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if not self.app_token:
            raise ValueError("FLOUCI_APP_TOKEN non configuré")
        payload = {
            'app_token': self.app_token,
            'app_secret': self.app_secret,
            'amount': int(amount * 1000),  # Flouci = millimes
            'accept_card': 'true',
            'session_timeout_secs': 1800,
            'success_link': metadata.get('success_url', ''),
            'fail_link': metadata.get('fail_url', ''),
            'developer_tracking_id': metadata.get('payment_intent_id', str(uuid.uuid4())),
        }
        resp = requests.post(f"{FLOUCI_BASE_URL}/add_request", json=payload)
        resp.raise_for_status()
        data = resp.json()
        if not data.get('result', {}).get('success'):
            raise Exception("Flouci: échec création paiement")
        payment_id = data['result']['payment_id']
        return {
            'provider_payment_id': payment_id,
            'checkout_url': f"https://pay.flouci.com/new-checkout/{payment_id}",
        }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        return True
    
    def parse_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        import json
        data = json.loads(payload)
        success = data.get('payment', {}).get('success', False)
        return {
            'type': 'payment.success' if success else 'payment.failed',
            'provider_reference': data.get('payment', {}).get('id', str(uuid.uuid4())),
            'provider_payment_id': data.get('payment', {}).get('id', ''),
            'amount': float(data.get('payment', {}).get('amount', 0)) / 1000,
            'currency': 'TND',
            'metadata': {},
        }
    
    def get_payment_status(self, provider_payment_id: str) -> str:
        return 'SUCCESS'
    
    def refund_payment(self, provider_payment_id: str, amount: float, reason: str) -> Dict[str, Any]:
        return {'status': 'PENDING', 'note': 'Remboursement manuel Flouci requis'}
    
    def cancel_payment(self, provider_payment_id: str) -> bool:
        return True
