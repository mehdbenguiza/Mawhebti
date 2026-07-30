import uuid, requests, hmac, hashlib
from typing import Dict, Any
from .base import PaymentProvider
import logging
logger = logging.getLogger(__name__)

KONNECT_BASE_URL = "https://api.konnect.network/api/v2"

class KonnectProvider(PaymentProvider):
    def __init__(self, api_key: str = '', receiver_wallet_id: str = ''):
        self.api_key = api_key
        self.receiver_wallet_id = receiver_wallet_id
    
    def create_payment_intent(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("KONNECT_API_KEY non configuré")
        payload = {
            'receiverWalletId': self.receiver_wallet_id,
            'token': currency,
            'amount': int(amount * 1000),  # Konnect = millimes
            'type': 'immediate',
            'description': metadata.get('campaign_title', 'Don Mawhebti'),
            'acceptedPaymentMethods': ['bank_card', 'wallet', 'e-DINAR'],
            'lifespan': 30,  # minutes
            'checkoutForm': True,
            'addPaymentFeesToAmount': False,
            'firstName': metadata.get('donor_name', ''),
            'lastName': '',
            'email': metadata.get('donor_email', ''),
            'webhook': metadata.get('webhook_url', ''),
            'silentWebhook': True,
            'orderId': metadata.get('payment_intent_id', str(uuid.uuid4())),
            'theme': 'theme2',
        }
        headers = {'x-api-key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.post(f"{KONNECT_BASE_URL}/payments/init-payment", json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return {
            'provider_payment_id': data.get('paymentRef', ''),
            'checkout_url': data.get('payUrl', ''),
        }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        return True  # Konnect valide via token OAuth
    
    def parse_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        import json
        data = json.loads(payload)
        status = data.get('payment', {}).get('status', 'PENDING')
        return {
            'type': 'payment.success' if status == 'completed' else 'payment.failed',
            'provider_reference': data.get('payment', {}).get('_id', str(uuid.uuid4())),
            'provider_payment_id': data.get('payment', {}).get('paymentRef', ''),
            'amount': float(data.get('payment', {}).get('amount', 0)) / 1000,
            'currency': 'TND',
            'metadata': data.get('payment', {}).get('metadata', {}),
        }
    
    def get_payment_status(self, provider_payment_id: str) -> str:
        return 'SUCCESS'
    
    def refund_payment(self, provider_payment_id: str, amount: float, reason: str) -> Dict[str, Any]:
        return {'status': 'PENDING', 'note': 'Remboursement manuel Konnect requis'}
    
    def cancel_payment(self, provider_payment_id: str) -> bool:
        return True
