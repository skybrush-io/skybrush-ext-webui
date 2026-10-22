"""Minimal TOML writer for exporting JSON-like configuration objects.

Python's standard library can only read TOML, and the configuration objects
of the server contain only dictionaries, lists, strings, numbers, booleans and
``None``, so a small writer is enough and spares us an extra dependency.
"""

from __future__ import annotations

import json
import math
import re
from collections.abc import Mapping
from typing import Any

__all__ = ("dumps",)


_BARE_KEY = re.compile(r"[A-Za-z0-9_-]+")


def dumps(data: Mapping[str, Any]) -> str:
    """Formats a JSON-like dictionary as a TOML document.

    Keys are sorted alphabetically. Keys whose value is ``None`` are omitted
    because TOML has no null value.

    Raises:
        TypeError: if the dictionary contains a value that cannot be represented
            in TOML, e.g., ``None`` in a list
    """
    lines: list[str] = []
    _write_table(lines, (), data, header=False)
    return "\n".join(lines).lstrip("\n") + "\n"


def _is_array_of_tables(value: Any) -> bool:
    return (
        isinstance(value, list)
        and len(value) > 0
        and all(isinstance(item, Mapping) for item in value)
    )


def _format_key(key: str) -> str:
    return key if _BARE_KEY.fullmatch(key) else _format_string(key)


def _format_path(path: tuple[str, ...]) -> str:
    return ".".join(_format_key(key) for key in path)


def _format_string(value: str) -> str:
    # JSON strings are valid TOML basic strings, except that TOML also forbids
    # an unescaped DEL character
    return json.dumps(value, ensure_ascii=False).replace("\x7f", "\\u007F")


def _format_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if math.isnan(value):
            return "nan"
        if math.isinf(value):
            return "inf" if value > 0 else "-inf"
        return repr(value)
    if isinstance(value, str):
        return _format_string(value)
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(_format_value(item) for item in value) + "]"
    if isinstance(value, Mapping):
        items = [
            f"{_format_key(str(key))} = {_format_value(item)}"
            for key, item in sorted(value.items())
            if item is not None
        ]
        return "{ " + ", ".join(items) + " }" if items else "{}"
    raise TypeError(f"Cannot represent {type(value).__name__} in TOML")


def _write_table(
    lines: list[str], path: tuple[str, ...], table: Mapping[str, Any], *, header: bool
) -> None:
    items = sorted(
        (str(key), value) for key, value in table.items() if value is not None
    )
    scalars = [
        (key, value)
        for key, value in items
        if not isinstance(value, Mapping) and not _is_array_of_tables(value)
    ]

    # Subtables create their parent implicitly, so a header is needed only if
    # the table has its own values or it would otherwise disappear
    if header and (scalars or len(scalars) == len(items)):
        lines.extend(("", f"[{_format_path(path)}]"))

    for key, value in scalars:
        lines.append(f"{_format_key(key)} = {_format_value(value)}")

    for key, value in items:
        if isinstance(value, Mapping):
            _write_table(lines, (*path, key), value, header=True)

    for key, value in items:
        if _is_array_of_tables(value):
            for item in value:
                lines.extend(("", f"[[{_format_path((*path, key))}]]"))
                _write_table(lines, (*path, key), item, header=False)
