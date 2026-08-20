DorukStation runtime user folders

The web build cannot create real files beside the app while it is running, so user folders are virtual browser-storage namespaces. Permanent profiles carry a folder path like users/user-abc123/. Guest sessions use users/__guest__/guest-.../ and are purged automatically.

Existing pre-v0.15 game save namespace identifiers are preserved so upgrades do not intentionally erase existing worlds.
