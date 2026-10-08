from skybrush_ext_webui.frontend import FrontendAssets, _parse_manifest


def test_parse_manifest():
    manifest = {
        "_vendor-def.js": {
            "file": "assets/vendor-def.js",
            "css": ["assets/vendor-def.css"],
        },
        "_utils-ghi.js": {
            "file": "assets/utils-ghi.js",
            "imports": ["_vendor-def.js"],
        },
        "src/main.tsx": {
            "file": "assets/index-abc.js",
            "src": "src/main.tsx",
            "isEntry": True,
            "imports": ["_vendor-def.js", "_utils-ghi.js"],
            "dynamicImports": ["src/pages/Messages.tsx"],
            "css": ["assets/index-abc.css"],
        },
        "src/pages/Messages.tsx": {
            "file": "assets/Messages-jkl.js",
            "isDynamicEntry": True,
        },
    }

    assert _parse_manifest(manifest) == FrontendAssets(
        script="app/assets/index-abc.js",
        stylesheets=["app/assets/index-abc.css", "app/assets/vendor-def.css"],
        preloads=["app/assets/vendor-def.js", "app/assets/utils-ghi.js"],
    )


def test_parse_manifest_without_entry():
    assert _parse_manifest({"_vendor.js": {"file": "assets/vendor.js"}}) is None
