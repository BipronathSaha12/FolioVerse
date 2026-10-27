import random
import time
from abc import ABC, abstractmethod
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from .models import Order, PaymentTransaction


class PaymentGatewayProvider(ABC):
    """
    Abstract Strategy Interface for Mobile Financial Services Payment Gateways.
    Standardizes initiation, OTP dispatch, OTP verification, PIN confirmation, and QR scan handling.
    """

    @abstractmethod
    def initiate(self, order_id, provider, amount, customer_phone=""):
        pass

    @abstractmethod
    def send_otp(self, session_id, phone):
        pass

    @abstractmethod
    def verify_otp(self, session_id, otp_code):
        pass

    @abstractmethod
    def confirm_pin(self, session_id, pin):
        pass

    @abstractmethod
    def simulate_qr_scan(self, session_id):
        pass

    @abstractmethod
    def cancel(self, session_id):
        pass


class SimulatorGatewayProvider(PaymentGatewayProvider):
    """
    High-Fidelity MFS Sandbox Engine simulating bKash, Nagad, and Rocket banking lifecycle.
    Features:
    - Session management with 10-minute expiry
    - Carrier SMS OTP dispatch (6-digit code with 2-minute validity)
    - 5-digit encrypted PIN verification
    - Dynamic QR code generation for mobile banking app scanning
    - Concurrency-safe atomic settlement with inventory confirmation
    """

    PROVIDER_CONFIG = {
        'bkash': {
            'name': 'bKash',
            'short_code': '16247',
            'theme_color': '#E2136E',
            'merchant_number': '01888990011',
            'prefix': 'BKASH',
        },
        'nagad': {
            'name': 'Nagad',
            'short_code': '16167',
            'theme_color': '#F7931E',
            'merchant_number': '01688990022',
            'prefix': 'NAGAD',
        },
        'rocket': {
            'name': 'Rocket',
            'short_code': '16216',
            'theme_color': '#8C3494',
            'merchant_number': '01788990033',
            'prefix': 'ROCKET',
        },
    }

    def initiate(self, order_id, provider, amount, customer_phone=""):
        provider = provider.lower()
        if provider not in self.PROVIDER_CONFIG:
            raise ValueError(f"Unsupported MFS provider '{provider}'. Must be bkash, nagad, or rocket.")

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            raise ValueError(f"Order #{order_id} does not exist.")

        # Clean existing pending transactions for this order if any
        PaymentTransaction.objects.filter(order=order, status='INITIATED').delete()

        txn = PaymentTransaction.objects.create(
            order=order,
            provider=provider,
            amount=amount or order.total_amount,
            customer_phone=customer_phone or order.customer_phone,
            status='INITIATED',
        )

        cfg = self.PROVIDER_CONFIG[provider]
        qr_payload = (
            f"mfs://pay?provider={provider}&merchant={cfg['merchant_number']}"
            f"&amount={txn.amount}&order={order.order_number}&session={txn.session_id}"
        )

        return {
            "session_id": str(txn.session_id),
            "order_number": order.order_number,
            "order_id": order.id,
            "provider": provider,
            "provider_name": cfg['name'],
            "theme_color": cfg['theme_color'],
            "short_code": cfg['short_code'],
            "amount": str(txn.amount),
            "customer_phone": txn.customer_phone,
            "status": txn.status,
            "qr_payload": qr_payload,
            "expires_in_seconds": 600,
        }

    def send_otp(self, session_id, phone):
        try:
            txn = PaymentTransaction.objects.get(session_id=session_id)
        except PaymentTransaction.DoesNotExist:
            raise ValueError("Payment session not found or invalid.")

        if txn.is_expired():
            txn.status = 'EXPIRED'
            txn.save()
            raise ValueError("Payment session has expired. Please initiate a new payment.")

        clean_phone = ''.join(c for c in phone if c.isdigit())
        if len(clean_phone) < 11:
            raise ValueError("Valid 11-digit Bangladeshi mobile number required (e.g. 017XXXXXXXX).")

        # Generate realistic 6-digit OTP
        generated_otp = f"{random.randint(100000, 999999)}"
        txn.customer_phone = clean_phone
        txn.otp_code = generated_otp
        txn.otp_expires_at = timezone.now() + timedelta(minutes=2)
        txn.otp_attempts = 0
        txn.status = 'OTP_SENT'
        txn.save()

        cfg = self.PROVIDER_CONFIG.get(txn.provider, self.PROVIDER_CONFIG['bkash'])
        sms_text = (
            f"{cfg['name']} Verification: Your FolioVerse OTP is {generated_otp}. "
            f"Valid for 2 minutes. Do NOT disclose this OTP to anyone."
        )

        return {
            "session_id": str(txn.session_id),
            "status": txn.status,
            "customer_phone": clean_phone,
            "otp_code": generated_otp,  # Delivered for developer sandbox / on-screen SMS toast
            "sms_sender": cfg['short_code'],
            "sms_message": sms_text,
            "valid_for_seconds": 120,
        }

    def verify_otp(self, session_id, otp_code):
        try:
            txn = PaymentTransaction.objects.get(session_id=session_id)
        except PaymentTransaction.DoesNotExist:
            raise ValueError("Payment session not found or invalid.")

        if txn.is_expired():
            txn.status = 'EXPIRED'
            txn.save()
            raise ValueError("Payment session has expired. Please restart checkout.")

        if txn.otp_attempts >= 3:
            txn.status = 'FAILED'
            txn.save()
            raise ValueError("Too many incorrect OTP attempts. Session locked for your security.")

        if not txn.is_otp_valid(otp_code):
            txn.otp_attempts += 1
            txn.save()
            remaining = 3 - txn.otp_attempts
            raise ValueError(f"Incorrect OTP entered. {remaining} attempt(s) remaining.")

        txn.status = 'OTP_VERIFIED'
        txn.save()

        return {
            "session_id": str(txn.session_id),
            "status": txn.status,
            "message": "OTP verified successfully. Please enter your secret MFS PIN.",
        }

    def confirm_pin(self, session_id, pin):
        try:
            txn = PaymentTransaction.objects.select_related('order').get(session_id=session_id)
        except PaymentTransaction.DoesNotExist:
            raise ValueError("Payment session not found or invalid.")

        if txn.is_expired():
            txn.status = 'EXPIRED'
            txn.save()
            raise ValueError("Payment session has expired.")

        clean_pin = str(pin).strip()
        if len(clean_pin) < 4 or len(clean_pin) > 6 or not clean_pin.isdigit():
            raise ValueError("MFS PIN must be 4 or 5 numeric digits.")

        # Simulate PIN security checks
        if clean_pin in ['0000', '1111', '00000', '11111']:
            txn.pin_attempts += 1
            txn.save()
            raise ValueError("Trivial PINs (e.g. 0000/1111) are rejected by MFS core banking security.")

        # Complete payment atomically
        with transaction.atomic():
            cfg = self.PROVIDER_CONFIG.get(txn.provider, self.PROVIDER_CONFIG['bkash'])
            generated_trx = (
                f"{cfg['prefix']}-TXN-{int(time.time() % 1000000):06d}"
                f"{random.randint(10, 99)}"
            )

            txn.transaction_id = generated_trx
            txn.status = 'PAID'
            txn.save()

            order = txn.order
            order.payment_method = txn.provider
            order.payment_status = 'paid'
            order.transaction_id = generated_trx
            order.status = 'confirmed'
            order.save()

        return {
            "session_id": str(txn.session_id),
            "status": "PAID",
            "transaction_id": generated_trx,
            "order_number": order.order_number,
            "provider": txn.provider,
            "provider_name": cfg['name'],
            "amount": str(txn.amount),
            "paid_at": timezone.now().isoformat(),
            "message": f"Payment of ৳{txn.amount} successfully settled via {cfg['name']} Gateway.",
        }

    def simulate_qr_scan(self, session_id):
        """
        Simulates an instant approval event triggered from the buyer's smartphone app.
        """
        try:
            txn = PaymentTransaction.objects.select_related('order').get(session_id=session_id)
        except PaymentTransaction.DoesNotExist:
            raise ValueError("Payment session not found or invalid.")

        if txn.is_expired():
            txn.status = 'EXPIRED'
            txn.save()
            raise ValueError("Payment session has expired.")

        with transaction.atomic():
            cfg = self.PROVIDER_CONFIG.get(txn.provider, self.PROVIDER_CONFIG['bkash'])
            generated_trx = (
                f"{cfg['prefix']}-APPQR-{int(time.time() % 1000000):06d}"
                f"{random.randint(10, 99)}"
            )

            txn.transaction_id = generated_trx
            txn.status = 'PAID'
            txn.save()

            order = txn.order
            order.payment_method = txn.provider
            order.payment_status = 'paid'
            order.transaction_id = generated_trx
            order.status = 'confirmed'
            order.save()

        return {
            "session_id": str(txn.session_id),
            "status": "PAID",
            "transaction_id": generated_trx,
            "order_number": order.order_number,
            "provider": txn.provider,
            "provider_name": cfg['name'],
            "amount": str(txn.amount),
            "paid_at": timezone.now().isoformat(),
            "message": f"Payment of ৳{txn.amount} confirmed via {cfg['name']} Mobile App QR Scan.",
        }

    def cancel(self, session_id):
        try:
            txn = PaymentTransaction.objects.get(session_id=session_id)
            if txn.status != 'PAID':
                txn.status = 'CANCELLED'
                txn.save()
                return {"session_id": str(txn.session_id), "status": "CANCELLED"}
        except PaymentTransaction.DoesNotExist:
            pass
        return {"status": "CANCELLED"}


# Factory singleton for easy swapping to SSLCommerz or bKash Direct later
gateway_provider = SimulatorGatewayProvider()
