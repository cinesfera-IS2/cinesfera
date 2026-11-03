from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.foto_perfil import FotoPerfil
from app.models.usuario import Usuario


TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024
TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp"}


class FotoPerfilInvalidaError(ValueError):
    pass


def detectar_tipo_imagen(contenido: bytes) -> str | None:
    """Reconoce formatos seguros mediante su firma, sin confiar en el navegador."""
    if contenido.startswith(b"\xFF\xD8\xFF"):
        return "image/jpeg"
    if contenido.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if (
        len(contenido) >= 12
        and contenido.startswith(b"RIFF")
        and contenido[8:12] == b"WEBP"
    ):
        return "image/webp"
    return None


def validar_foto(contenido: bytes, tipo_declarado: str | None) -> str:
    if not contenido:
        raise FotoPerfilInvalidaError("La imagen está vacía")
    if len(contenido) > TAMANO_MAXIMO_FOTO:
        raise FotoPerfilInvalidaError("La imagen no puede superar los 5 MB")

    tipo_real = detectar_tipo_imagen(contenido)
    if tipo_real not in TIPOS_PERMITIDOS:
        raise FotoPerfilInvalidaError("La imagen debe ser JPEG, PNG o WebP")
    if tipo_declarado != tipo_real:
        raise FotoPerfilInvalidaError("El contenido no coincide con el tipo de imagen")
    return tipo_real


def guardar_foto(
    db: Session,
    usuario: Usuario,
    contenido: bytes,
    tipo_mime: str,
) -> Usuario:
    foto = db.get(FotoPerfil, usuario.id)
    if foto is None:
        foto = FotoPerfil(usuario_id=usuario.id)
        db.add(foto)
    foto.contenido = contenido
    foto.tipo_mime = tipo_mime

    version = uuid4().hex
    usuario.foto_url = (
        f"{settings.api_url.rstrip('/')}/usuarios/{usuario.id}/foto-perfil?v={version}"
    )
    db.commit()
    db.refresh(usuario)
    return usuario


def eliminar_foto(db: Session, usuario: Usuario) -> Usuario:
    foto = db.get(FotoPerfil, usuario.id)
    if foto is not None:
        db.delete(foto)
    usuario.foto_url = None
    db.commit()
    db.refresh(usuario)
    return usuario
