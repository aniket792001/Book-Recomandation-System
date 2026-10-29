import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import SendOtpRequest, Token, UserCreate, UserLogin, UserResponse, VerifyOtpRequest
from app.services.otp_service import create_and_send_otp, verify_otp_code

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check existing user
    stmt = select(User).where(User.email == user_in.email.lower())
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == credentials.email.lower())
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled.")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: dict, db: AsyncSession = Depends(get_db)):
    incoming_refresh = token_data.get("refresh_token")
    if not incoming_refresh:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing refresh token.")

    payload = decode_token(incoming_refresh)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    user_id = payload.get("sub")
    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    new_access = create_access_token(subject=str(user.id))
    new_refresh = create_refresh_token(subject=str(user.id))

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/otp/send")
async def send_otp(req: SendOtpRequest):
    """
    Generate and dispatch a 6-digit verification code to the user's email.
    """
    code = create_and_send_otp(req.email)
    return {
        "status": "success",
        "message": f"Verification code sent to {req.email}",
        "expires_in_seconds": 300,
        "demo_code": code  # Provided for convenience in local development
    }


@router.post("/otp/verify", response_model=Token)
async def verify_otp(req: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify the 6-digit OTP code. Automatically provisions an account if first-time user.
    Returns JWT access & refresh tokens.
    """
    is_valid = verify_otp_code(req.email, req.code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    # Find or create user
    normalized_email = req.email.strip().lower()
    stmt = select(User).where(User.email == normalized_email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        # Auto-create user for passwordless login
        generated_password = uuid.uuid4().hex
        user = User(
            email=normalized_email,
            hashed_password=get_password_hash(generated_password),
            full_name=normalized_email.split("@")[0].capitalize()
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled.")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
