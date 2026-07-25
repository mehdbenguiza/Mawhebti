import os
import stripe
from typing import Dict, Any
from .base import PaymentProvider

class StripeProvider(PaymentProvider):
    def __init__(self):
        # We read from os.getenv to keep it simple, or integrate with a pydantic Settings class
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_mock")
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    def create_payment_intent(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a Stripe Checkout Session for the donation.
        Returns the session ID and the URL to redirect the user to.
        """
        # Stripe expects amount in cents for most currencies
        stripe_amount = int(amount * 100)
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency.lower(),
                    'product_data': {
                        'name': metadata.get('campaign_title', 'Soutien Campagne Mawhebti'),
                        'description': f"Donation pour {metadata.get('talent_name', 'un talent')}",
                    },
                    'unit_amount': stripe_amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            metadata=metadata,
            success_url=f"{self.frontend_url}/campaigns/{metadata.get('campaign_id')}/donate/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{self.frontend_url}/campaigns/{metadata.get('campaign_id')}",
        )
        
        return {
            "provider_payment_id": session.id,
            "checkout_url": session.url
        }
        
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verifies the signature sent by Stripe in the Webhook header.
        """
        try:
            stripe.Webhook.Signature.verify_header(
                payload, signature, self.webhook_secret
            )
            return True
        except stripe.error.SignatureVerificationError:
            return False
            
    def parse_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """
        Parses the Stripe webhook event into a standardized dictionary.
        """
        event = stripe.Webhook.construct_event(
            payload, signature, self.webhook_secret
        )
        
        return {
            "type": event.type,
            "data": event.data.object,
            "provider_reference": event.id  # This is the unique Stripe Event ID
        }
