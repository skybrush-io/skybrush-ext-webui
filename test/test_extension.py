from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pytest
from flockwave.server.utils import overridden
from quart_trio import QuartTrio
from semver import Version

from skybrush_ext_webui import extension
from skybrush_ext_webui.frontend import FrontendAssets

LOCALHOST = {"client": ("127.0.0.1", 12345)}


@dataclass
class FakeExtensionManager:
    loaded: set[str] = field(default_factory=lambda: {"http_server", "webui"})
    app_restart_requested: bool = False
    configs: dict[str, Any] = field(
        default_factory=lambda: {
            "http_server": {"enabled": True, "port": 5000},
            "webui": {"enabled": True, "route": "/webui"},
            "debug": {},
        }
    )

    @property
    def known_extensions(self) -> list[str]:
        return list(self.configs)

    def is_loaded(self, name: str) -> bool:
        return name in self.loaded

    def get_description_of_extension(self, name: str) -> str:
        return f"The {name} extension"

    def get_tags_of_extension(self, name: str) -> set[str]:
        return {"system"} if name == "http_server" else set()

    def was_app_restart_requested_by(self, name: str) -> bool:
        return False

    def get_version_of_extension(self, name: str) -> Version | None:
        return Version(1, 2, 3) if name == "webui" else None

    def get_dependencies_of_extension(self, name: str) -> set[str]:
        return {"http_server"} if name == "webui" else set()

    def get_reverse_dependencies_of_extension(self, name: str) -> set[str]:
        return {"webui"} if name == "http_server" else set()

    def get_configuration_snapshot(self, name: str) -> dict[str, Any]:
        return dict(self.configs[name])

    def get_configuration_schema(self, name: str) -> dict[str, Any] | None:
        if name == "webui":
            return {"type": "object", "properties": {"route": {"type": "string"}}}
        return None


@dataclass
class FakeConfigurator:
    loaded_files: list[Any] = field(default_factory=list)


@dataclass
class FakeServer:
    extension_manager: FakeExtensionManager = field(
        default_factory=FakeExtensionManager
    )
    configurator: FakeConfigurator = field(default_factory=FakeConfigurator)


ASSETS = FrontendAssets(
    script="app/assets/index-abc.js",
    stylesheets=["app/assets/index-abc.css"],
    preloads=["app/assets/vendor-def.js"],
)


@pytest.fixture
def server() -> FakeServer:
    return FakeServer()


@pytest.fixture
def client(server, monkeypatch):
    monkeypatch.setattr(extension, "get_frontend_assets", lambda: ASSETS)

    quart_app = QuartTrio(__name__)
    quart_app.register_blueprint(extension.blueprint, url_prefix="/webui")

    with overridden(vars(extension), app=server, is_public=False, log=None):
        yield quart_app.test_client()


async def get(client, path: str, scope_base=LOCALHOST):
    return await client.get(path, scope_base=scope_base)


async def test_rejects_non_localhost(client):
    response = await get(client, "/webui/api/state", {"client": ("10.0.0.1", 1)})
    assert response.status_code == 403


async def test_index_redirects_to_extensions(client):
    response = await get(client, "/webui/")
    assert response.status_code == 302
    assert response.headers["Location"].endswith("/webui/extensions")


async def test_state(client, server):
    server.extension_manager.app_restart_requested = True
    response = await get(client, "/webui/api/state")
    assert await response.get_json() == {
        "canSaveConfig": False,
        "debug": False,
        "restartRequested": True,
    }


async def test_list_extensions(client):
    response = await get(client, "/webui/api/extensions")
    data = await response.get_json()
    by_name = {ext["name"]: ext for ext in data["extensions"]}
    assert set(by_name) == {"http_server", "webui", "debug"}
    assert by_name["webui"] == {
        "name": "webui",
        "description": "The webui extension",
        "loaded": True,
        "tags": [],
        "restartRequested": False,
        "version": "1.2.3",
    }
    assert by_name["http_server"]["tags"] == ["system"]
    assert by_name["debug"]["loaded"] is False


async def test_extension_details(client):
    response = await get(client, "/webui/api/extensions/webui")
    data = await response.get_json()
    assert data["dependencies"] == ["http_server"]
    assert data["dependents"] == []
    assert data["config"] == {"route": "/webui"}
    assert data["schema"]["properties"]["route"] == {"type": "string"}


async def test_extension_details_unknown(client):
    response = await get(client, "/webui/api/extensions/nonexistent")
    assert response.status_code == 404
    response = await get(client, "/webui/extensions/nonexistent")
    assert response.status_code == 404


async def test_version_info(client):
    response = await get(client, "/webui/api/version-info")
    data = await response.get_json()
    names = [dist["name"] for dist in data["distributions"]]
    assert "quart" in [name.lower() for name in names]
    assert names == sorted(names, key=str.lower)


@pytest.mark.parametrize("path", ["/webui/messages", "/webui/threads", "/webui/tasks"])
async def test_debug_pages_hidden_without_debug(client, path):
    response = await get(client, path)
    assert response.status_code == 404


@pytest.mark.parametrize("path", ["/webui/api/threads", "/webui/api/tasks"])
async def test_debug_api_hidden_without_debug(client, path):
    response = await get(client, path)
    assert response.status_code == 404


async def test_debug_api(client, server):
    server.extension_manager.loaded.add("debug")

    response = await get(client, "/webui/api/threads")
    threads = (await response.get_json())["threads"]
    assert any(thread["name"] == "MainThread" for thread in threads)

    response = await get(client, "/webui/api/tasks")
    tasks = (await response.get_json())["tasks"]
    assert tasks[0]["level"] == 0
    assert all(task["level"] >= 0 for task in tasks)


@pytest.mark.parametrize(
    "path",
    [
        "/webui/extensions",
        "/webui/extensions/webui",
        "/webui/version-info",
    ],
)
async def test_pages_render_app_shell(client, path):
    response = await get(client, path)
    assert response.status_code == 200
    html = await response.get_data(as_text=True)
    assert '<base href="/webui/">' in html
    assert '<script type="module" src="static/app/assets/index-abc.js">' in html
    assert '<link rel="stylesheet" href="static/app/assets/index-abc.css">' in html
    assert '<link rel="modulepreload" href="static/app/assets/vendor-def.js">' in html
    assert '"restartRequested": false' in html or '"restartRequested":false' in html


async def test_pages_when_frontend_missing(client, monkeypatch):
    monkeypatch.setattr(extension, "get_frontend_assets", lambda: None)
    response = await get(client, "/webui/extensions")
    assert response.status_code == 503
    assert "Frontend not built" in await response.get_data(as_text=True)
