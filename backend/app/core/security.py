import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

import jwt
from dotenv import load_dotenv
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash


BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BACKEND_DIR / ".env")


password_hash = PasswordHash.recommended()


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(
    os.getenv("JWT_EXPIRE_MINUTES", "30")
)


def generar_hash_password(password: str) -> str:
    return password_hash.hash(password)


def verificar_password(
    password: str,
    password_hash_guardado: str
) -> bool:
    return password_hash.verify(
        password,
        password_hash_guardado
    )


def generar_token_acceso(usuario_id: UUID) -> str:
    if not JWT_SECRET_KEY:
        raise RuntimeError(
            "Falta configurar JWT_SECRET_KEY en backend/.env"
        )

    expiracion = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(usuario_id),
        "exp": expiracion
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


def decodificar_token_acceso(token: str) -> UUID:
    if not JWT_SECRET_KEY:
        raise RuntimeError(
            "Falta configurar JWT_SECRET_KEY en backend/.env"
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        usuario_id = payload.get("sub")

        if not usuario_id:
            raise ValueError("Token sin usuario")

        return UUID(usuario_id)

    except (InvalidTokenError, ValueError) as error:
        raise ValueError(
            "Token inválido o expirado"
        ) from error