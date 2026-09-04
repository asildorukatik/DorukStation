DorukStation runtime user folders
=================================

DorukStation profiles use isolated browser-storage namespaces that mirror a
folder layout. A permanent profile receives a root such as:

  users/user-abc123/
    shell/                 shell settings and per-user Home/Games-folder choices
    games/<game-id>/       each game's save/localStorage namespace
    imported/              logical home for the user's imported HTML app list

The browser build cannot create those physical directories beside index.html at
runtime; the paths are namespace identifiers. Guest folders live below
users/__guest__/ and are purged automatically.

Installed game files are global. A different user gets the same installed game
but a different users/<id>/games/<game-id>/ save namespace.
