from decimal import Decimal
from app.services.platform_fee_service import platform_fee_service

class AccountingService:
    def calculate_fees(self, gross_amount: Decimal) -> dict:
        return platform_fee_service.calculate(gross_amount)

accounting_service = AccountingService()
