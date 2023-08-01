# Kort

A mapping tool for Valheim's nomap mode.

## Features

- Large pannable/zoomable world map
- Multi-user support
- Record Markers, Tracks, and Outlines
    - Marker: record a point of interest
    - Track: record a path taken, such a road or sailing voyage
    - Outline: record the borders of an area, such as an island or lake
- Point and track list for managing points
- Ping current location on map
- Search point labels to find previous markers quickly

### Coming Soon

- Multiplayer Ping & Point additions
- UI improvements
    - Track kind UX fix
    - Entry box styling
    - Point list styling
    - Active poly highlight styling
    - Hide/show Tracks and Markers
    - Biome shading
- Multi-map support
- In UI user-management

## Screenshot

![Jotunheim Spawn Map](/doc/Jotunheim.png?raw=true)

## Running Kort

Run the server:

Run `go build` to produce the `kort` binary.

The server can be run with `./kort`, which will automatically start the api/web server.

`kort` can also manage users with `./kort add-user` and `./kort edit-permissions`

See `./kort --help` for more

See also `static/backup/Readme.md` for sample points and backup snippets
