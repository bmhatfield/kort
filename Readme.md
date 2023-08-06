<img src="static/images/compass.png" height="100">

# Kort ᚦᛚ

A mapping tool for Valheim's hardcore / nomap mode.

![Jotunheim Spawn Map](/doc/Jotunheim.png?raw=true)

## Features

- Large pannable/zoomable world map
- Multi-user support
- Record Markers, Tracks, and Outlines
    - Marker: record a point of interest
    - Track: record a path taken, such a road or sailing voyage
    - Outline: record the borders of an area, such as an island or lake
- Point and track list for managing points
- Ping current location on map
    - With live pings from other kortographers
- Search point labels to find previous markers quickly

## Running Kort

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/bmhatfield/kort)

Run the server:

Run `go build` to produce the `kort` binary.

The server can be run with `./kort`, which will automatically start the api/web server.

`kort` can also manage users with `./kort add-user` and `./kort edit-permissions`

See `./kort --help` for more

See the [Point Exports](static/backup/Readme.md) page for sample points and backup `js` snippets.

## Coming Soon

- Multiplayer Live Point additions
- UI improvements
    - Point list styling
    - Active poly highlight styling
    - Hide/show Tracks and Markers
    - Biome shading
- Multi-map support
- In UI user-management

## See also

HTTP Server-sent-events: https://github.com/bmhatfield/sse
