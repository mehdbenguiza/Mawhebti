from .base import PaymentProvider
from .stripe_provider import StripeProvider

def get_payment_provider() -> PaymentProvider:
    # Factory function to get the current payment provider.
    # We use StripeProvider by default.
    return StripeProvider()
