from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


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