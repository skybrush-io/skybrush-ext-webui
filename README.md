# Web-based configuration user interface for Skybrush Server

This extension adds a web-based configuration user interface to Skybrush
Server. The user interface lets you list, load, unload, reload and configure
the extensions of the server, inspect version information, and view or save
the current configuration of the server. When the `debug` extension is also
loaded, additional pages become available for sending messages to the server
and for inspecting threads and Trio tasks.

By default, the user interface is mounted at `/webui` on the built-in HTTP
server and is accessible only from `localhost`.

## Configuration

```toml
[EXTENSIONS.webui]
# URL prefix where the web UI is mounted
route = "/webui"
# Allow access from hosts other than localhost. Use with caution; anyone
# who can access the web UI can reconfigure the server.
public = false
```

## Installation

1. Check out this repository using git.

2. Install [`uv`](https://docs.astral.sh/uv/) if you haven't done so yet;
   `uv` is a tool that allows you to install Skybrush Server and the
   extension you are working on in a completely isolated virtual environment.

3. Run `uv sync`; this will create a virtual environment and install
   Skybrush Server with all required dependencies in it, as well as the code
   of the extension.

4. Run `uv run skybrushd` to start the server. It should automatically pick up
   the configuration file named `skybrush.toml` and load the extension.
