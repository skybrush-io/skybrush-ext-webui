"""Web-based configuration user interface for Skybrush Server."""

from .config import WebUIExtensionConfig as schema
from .extension import index, run

__all__ = ("dependencies", "description", "index", "run", "schema")

description = "Adds a web-based configuration user interface to the server."
"""The description of the extension that appears on the Skybrush server UI"""

dependencies = ("frontend", "http_server")
"""List of the names of other extensions that this extension depends on."""
