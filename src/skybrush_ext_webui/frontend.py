"""Helpers for locating the assets of the frontend application that is built
by Vite into the ``static/app`` folder of this package.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from importlib.resources import files
from pathlib import Path
from typing import Any

__all__ = ("FrontendAssets", "get_frontend_assets")


APP_FOLDER = "app"
"""Name of the folder within ``static`` where the frontend is built."""

MANIFEST_PATH = f"{APP_FOLDER}/.vite/manifest.json"
"""Path of the Vite manifest file, relative to the ``static`` folder."""


@dataclass(frozen=True)
class FrontendAssets:
    """Paths of the assets that the HTML page bootstrapping the frontend needs
    to refer to. All paths are relative to the ``static`` folder.
    """

    script: str
    stylesheets: list[str] = field(default_factory=list)
    preloads: list[str] = field(default_factory=list)


_cache: tuple[float | None, FrontendAssets | None] | None = None


def get_frontend_assets() -> FrontendAssets | None:
    """Returns the assets of the frontend application, or ``None`` if the
    frontend has not been built yet.

    The result is cached; the cache is invalidated when the modification time
    of the manifest changes so rebuilding the frontend while the server is
    running is picked up automatically.
    """
    global _cache

    manifest = files(__package__) / "static" / MANIFEST_PATH
    mtime: float | None = None
    if isinstance(manifest, Path):
        try:
            mtime = manifest.stat().st_mtime
        except OSError:
            _cache = None
            return None

    if _cache is not None and _cache[0] == mtime:
        return _cache[1]

    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        data = None

    assets = _parse_manifest(data) if isinstance(data, dict) else None
    _cache = (mtime, assets)
    return assets


def _parse_manifest(manifest: dict[str, Any]) -> FrontendAssets | None:
    """Extracts the entry script, its stylesheets and the chunks it imports
    statically from a Vite manifest.
    """
    entry = next(
        (
            chunk
            for chunk in manifest.values()
            if isinstance(chunk, dict) and chunk.get("isEntry")
        ),
        None,
    )
    if entry is None or "file" not in entry:
        return None

    stylesheets: list[str] = []
    preloads: list[str] = []
    seen: set[str] = set()

    def visit(chunk: dict[str, Any], *, is_entry: bool = False) -> None:
        for css in chunk.get("css", ()):
            path = f"{APP_FOLDER}/{css}"
            if path not in stylesheets:
                stylesheets.append(path)
        if not is_entry:
            preloads.append(f"{APP_FOLDER}/{chunk['file']}")
        for key in chunk.get("imports", ()):
            if key not in seen and key in manifest:
                seen.add(key)
                visit(manifest[key])

    visit(entry, is_entry=True)

    return FrontendAssets(
        script=f"{APP_FOLDER}/{entry['file']}",
        stylesheets=stylesheets,
        preloads=preloads,
    )
