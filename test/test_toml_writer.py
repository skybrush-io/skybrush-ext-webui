import tomllib

import pytest

from skybrush_ext_webui.toml_writer import dumps


def test_roundtrip():
    data = {
        "DEBUG": False,
        "PORT": 5000,
        "RATIO": 0.5,
        "NAME": 'Skybrush "server"\n\t\x7f ünicode',
        "EMPTY_LIST": [],
        "EXTENSIONS": {
            "empty": {},
            "http_server": {"host": "", "port": 5000},
            "nested": {"only": {"tables": {"value": 1}}},
            "dotted.key": {"weird key": [1, "two", {"three": 3}, [4.0]]},
            "connections": {
                "items": [
                    {"name": "a", "options": {"baud": 57600}},
                    {"name": "b"},
                ]
            },
        },
    }
    assert tomllib.loads(dumps(data)) == data


def test_special_floats():
    parsed = tomllib.loads(dumps({"a": float("inf"), "b": float("-inf")}))
    assert parsed == {"a": float("inf"), "b": float("-inf")}


def test_none_values_are_omitted():
    assert tomllib.loads(dumps({"a": None, "b": {"c": None, "d": 1}})) == {
        "b": {"d": 1}
    }


def test_empty_tables_are_kept():
    assert dumps({"EXTENSIONS": {"gps": {}}}) == "[EXTENSIONS.gps]\n"


def test_none_in_list_is_rejected():
    with pytest.raises(TypeError):
        dumps({"a": [1, None]})
