from pydantic import BaseModel, Field

__all__ = ("WebUIExtensionConfig",)


class WebUIExtensionConfig(BaseModel):
    """Configuration model for the extension."""

    route: str = Field(
        default="/webui",
        description="The URL prefix where the web UI is mounted on the HTTP server.",
    )

    public: bool = Field(
        default=False,
        description=(
            "Whether the web UI is accessible from hosts other than localhost. "
            "Enable with caution; the web UI allows anyone to reconfigure the "
            "server."
        ),
    )
