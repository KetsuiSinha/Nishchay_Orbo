"""
Configuration settings for the Song Recommendation API.
"""
import json
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Paths
    DATASET_PATH: str = Field(default="../dataset.csv", description="Path to the dataset CSV file")
    BACKEND_DIR: Path = Field(default=Path(__file__).parent.parent.parent, description="Backend directory")
    ARTIFACTS_DIR: Path = Field(default=Path(__file__).parent.parent.parent, description="Artifacts directory")
    # Built frontend (served by the API when present — enables single-service deploys)
    FRONTEND_DIST: Path = Field(
        default=Path(__file__).parent.parent.parent.parent / "spotify-frontend" / "dist",
        description="Built frontend directory (dist) to serve from the API",
    )

    # Model hyperparameters
    TOP_K: int = Field(default=100, description="Number of similar tracks to keep per track")
    CHUNK_SIZE: int = Field(default=200, description="Chunk size for similarity computation")
    AUDIO_WEIGHT: float = Field(default=0.6, description="Weight for audio feature similarity")
    GENRE_WEIGHT: float = Field(default=0.4, description="Weight for genre similarity")

    # Audio features to use (comma-separated string from env)
    AUDIO_FEATURES_RAW: str = Field(
        default="danceability,energy,valence,acousticness,instrumentalness,liveness,tempo,loudness,speechiness",
        description="Comma-separated audio features",
        alias="AUDIO_FEATURES",
    )

    # API settings
    HOST: str = Field(default="0.0.0.0", description="API host")
    PORT: int = Field(default=8000, description="API port")

    # CORS — accepts a JSON array, a comma-separated list, or "*"
    CORS_ORIGINS_RAW: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Allowed CORS origins (JSON array, comma-separated list, or *)",
        alias="CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        extra = "ignore",
        populate_by_name = True,
    )

    @property
    def AUDIO_FEATURES(self) -> List[str]:
        """Parse comma-separated audio features string into list."""
        return [f.strip() for f in self.AUDIO_FEATURES_RAW.split(",") if f.strip()]

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS_ORIGINS: JSON array, comma-separated list, or '*' for allow-all."""
        raw = self.CORS_ORIGINS_RAW.strip()
        if raw == "*":
            return ["*"]
        if raw.startswith("["):
            try:
                return [str(o) for o in json.loads(raw)]
            except json.JSONDecodeError:
                pass
        return [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()