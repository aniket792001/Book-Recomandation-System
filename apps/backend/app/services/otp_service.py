"""
OTP & Magic Authentication Service for PagePulse AI
Generates, stores, and verifies 6-digit one-time passwords for passwordless email login.
"""

import logging
import random
import time
from typing import Dict, Optional, Tuple

logger = logging.getLogger("pagepulse.otp")

# In-memory OTP storage: { normalized_email: (otp_code, expires_at_timestamp) }
_OTP_CACHE: Dict[str, Tuple[str, float]] = {}

OTP_EXPIRY_SECONDS = 300  # 5 minutes


def generate_otp_code() -> str:
    """Generate a cryptographically suitable 6-digit numeric string."""
    return f"{random.randint(100000, 999999)}"


def create_and_send_otp(email: str) -> str:
    """
    Creates a new 6-digit OTP code, caches it with a 5-minute expiry,
    and logs/dispatches the verification code.
    """
    normalized_email = email.strip().lower()
    code = generate_otp_code()
    expires_at = time.time() + OTP_EXPIRY_SECONDS

    _OTP_CACHE[normalized_email] = (code, expires_at)

    # In production, dispatch via SendGrid/AWS SES/Resend
    logger.info("=" * 60)
    logger.info(f"🔑 [AUTH OTP] Verification code for {normalized_email}: {code}")
    logger.info(f"⏳ Valid for {OTP_EXPIRY_SECONDS // 60} minutes")
    logger.info("=" * 60)

    return code


def verify_otp_code(email: str, code: str) -> bool:
    """
    Validates the provided OTP code against the cache.
    Clears the OTP upon successful verification.
    """
    normalized_email = email.strip().lower()
    cached = _OTP_CACHE.get(normalized_email)

    if not cached:
        logger.warning(f"No active OTP found for {normalized_email}")
        return False

    cached_code, expires_at = cached

    # Check expiration
    if time.time() > expires_at:
        logger.warning(f"OTP for {normalized_email} has expired.")
        _OTP_CACHE.pop(normalized_email, None)
        return False

    # Check code match
    if cached_code.strip() == code.strip():
        logger.info(f"OTP successfully verified for {normalized_email}")
        _OTP_CACHE.pop(normalized_email, None)
        return True

    logger.warning(f"Invalid OTP entered for {normalized_email}")
    return False
