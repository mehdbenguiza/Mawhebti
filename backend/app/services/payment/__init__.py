import os
from .base import PaymentProvider
from .mock_provider import MockProvider
from .stripe_provider import StripeProvider
from .konnect_provider import KonnectProvider
from .flouci_provider import FlouciProvider

def get_payment_provider(provider_name: str = None) -> PaymentProvider:
    name = (provider_name or os.getenv('PAYMENT_PROVIDER', 'mock')).lower()
    if name == 'stripe':
        return StripeProvider(
            secret_key=os.getenv('STRIPE_SECRET_KEY', ''),
            webhook_secret=os.getenv('STRIPE_WEBHOOK_SECRET', '')
        )
    elif name == 'konnect':
        return KonnectProvider(
            api_key=os.getenv('KONNECT_API_KEY', ''),
            receiver_wallet_id=os.getenv('KONNECT_RECEIVER_WALLET_ID', '')
        )
    elif name == 'flouci':
        return FlouciProvider(
            app_token=os.getenv('FLOUCI_APP_TOKEN', ''),
            app_secret=os.getenv('FLOUCI_APP_SECRET', '')
        )
    return MockProvider()
