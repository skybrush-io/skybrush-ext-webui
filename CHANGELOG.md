# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [main]

## [1.2.0] - 2026-10-22

### Added

- Implemented a more modern user interface with React and `@shadcn/ui`.

- The server configuration can now be exported in TOML format as well as JSON.

### Changed

- Search in the extension list and the command menu now matches the beginnings
  of words in the name, description and tags of extensions instead of fuzzy
  matching, which produced too many unrelated results.

- The tag filter of the extension list now states that it shows extensions
  having all the selected tags.

- Notifications are now shown at the top center of the page so they do not
  cover the action buttons.

## [1.0.0] - 2026-10-08

Initial version, separated from the main Skybrush Server repository.
