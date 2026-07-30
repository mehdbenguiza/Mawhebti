import os
from decimal import Decimal, ROUND_HALF_UP

class PlatformFeeService:
    def __init__(self):
        self.fee_rate = Decimal(str(os.getenv('PLATFORM_FEE_RATE', '0.05')))
    
    def calculate(self, gross_amount: Decimal) -> dict:
        fee = (gross_amount * self.fee_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        net = gross_amount - fee
        return {
            'gross': float(gross_amount),
            'fee': float(fee),
            'net': float(net),
            'fee_rate': float(self.fee_rate),
            'currency': 'TND',
        }

platform_fee_service = PlatformFeeService()
