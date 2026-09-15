from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Configuración de la aplicación.

    Los valores se leen del archivo `.env` local y, si existen, las
    variables de entorno del sistema tienen prioridad. Render inyecta
    sus variables de esta segunda forma, así que en producción no hace
    falta ningún `.env`.
    """

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # local | production
    environment: str = "local"

    # URL pública donde queda publicada esta API.
    api_url: str = "http://localhost:8000"

    # Orígenes permitidos por CORS, separados por coma.
    cors_origins: str = "http://localhost:3000"

    # Conexión completa (la usa Render / Supabase). Si está vacía se
    # arma a partir de las piezas de abajo.
    database_url: str = ""

    db_host: str = ""
    db_port: int = 5432
    db_name: str = "postgres"
    db_user: str = ""
    db_password: str = ""
    db_sslmode: str = "require"

    @property
    def es_produccion(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def origenes_cors(self) -> list[str]:
        return [
            origen.strip()
            for origen in self.cors_origins.split(",")
            if origen.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
