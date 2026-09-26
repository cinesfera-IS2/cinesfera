
import hashlib
import hmac

from fastapi import HTTPException, Request, status

from app.core.security import JWT_SECRET_KEY


def generar_token_csrf(access_token: str) -> str:
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY no configurada")

    return hmac.new(
        JWT_SECRET_KEY.encode(),
        b"cinesfera:csrf:" + access_token.encode(),
        hashlib.sha256
    ).hexdigest()


def verificar_csrf(request: Request) -> None:
    access_token = request.cookies.get("access_token")

    # Las peticiones que usan exclusivamente Bearer
    # no necesitan CSRF.
    if not access_token:
        return

    token_recibido = request.headers.get("X-CSRF-Token")
    token_esperado = generar_token_csrf(access_token)

    if not token_recibido or not hmac.compare_digest(
        token_recibido,
        token_esperado
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF inválido o ausente"
        )
