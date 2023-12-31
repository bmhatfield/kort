const Cartograph = ({ polys, activePoint, pingPoints, otherPingPoints, getUser }) => {
    const [canvas, setCanvas] = React.useState();
    const [dimensions, setDimensions] = React.useState({
        height: window.innerHeight,
        width: window.innerWidth
    });
    const [otherPingObjects, setOtherPingObjects] = React.useState();
    const [activePointObject, setActivePointObject] = React.useState();
    const [pingObjects, setPingObjects] = React.useState();
    const [polyObjects, setPolyObjects] = React.useState();

    const cRef = React.useRef();

    const noFill = "";

    function resized() {
        setDimensions({
            height: window.innerHeight,
            width: window.innerWidth
        });
    };

    React.useEffect(() => {
        window.addEventListener("resize", resized);
        return () => window.removeEventListener("resize", resized);
    }, []);

    React.useEffect(() => {
        if (dimensions === undefined) return;

        const scale = 0.25;
        var canvas = new fabric.StaticCanvas(cRef.current, {
            height: dimensions.height,
            width: dimensions.width,
            viewportTransform: [scale, 0, 0, scale, (dimensions.width / 2), (dimensions.height / 2)],
            renderOnAddRemove: false,
        });
        setCanvas(canvas);

        const circleRadius = 10000;
        let world = new fabric.Circle({
            radius: circleRadius,
            stroke: "slategray",
            left: -circleRadius,
            top: -circleRadius,
            strokeWidth: 2,
            absolutePositioned: true,
        });
        world.set("fill", new fabric.Gradient({
            type: "radial",

            coords: {
                x1: world.width / 2,
                y1: world.height / 2,
                x2: world.width / 2,
                y2: world.height / 2,
                r1: world.width / 50, // inner
                r2: world.width / 2, // outer
            },
            colorStops: [
                { offset: 0, color: "#E5F3FF" },
                { offset: 0.9, color: "aliceblue" },
                { offset: 1, color: "#E5F3FF" },
            ],
        }));
        canvas.add(world);

        // Add a grid, inscribed in the border circle.
        for (var axis = -circleRadius; axis <= circleRadius; axis += circleRadius / 10) {
            let lineParams = {
                stroke: (axis === 0) ? '#aaaaaa' : 'lightgray',
                strokeWidth: (axis === 0) ? 1.3 : 1,
                clipPath: world
            }
            const x = new fabric.Line([-circleRadius, axis, circleRadius, axis], lineParams);
            const y = new fabric.Line([axis, -circleRadius, axis, circleRadius], lineParams);
            canvas.add(x, y);
        }

        // Force a full single render
        canvas.requestRenderAll();
    }, [dimensions, cRef]);

    React.useEffect(() => {
        if (polys === undefined || polys.length === 0) return

        // Remove all existing objects
        // This fixes double (or worse...) drawing
        // objects as things change.
        if (polyObjects !== undefined) {
            canvas.remove(...polyObjects);
        }

        // Settings
        const opts = {
            label: {
                radius: 1.7,
                height: 34,
                leftOffset: 8,
                topOffset: -(34 / 2),
            }
        };

        // Create label objects
        const labels = polys.map((poly, i) => {
            return poly.points.filter((p => p.label !== undefined && p.label.length > 0)).map((p) => {
                const x = Number(p.x);
                const y = -Number(p.y);

                const isActive = activePoint !== undefined && activePoint.x === p.x && activePoint.y === p.y;

                var pc = new fabric.Circle({
                    radius: opts.label.radius,
                    fill: "slategray",
                    visible: !isActive,
                });
                var l = new fabric.Text(p.label, {
                    top: opts.label.topOffset,
                    left: 3 + opts.label.leftOffset,
                    fill: "black",
                    fontFamily: "valheim",
                    fontSize: 20,
                });
                var lp = new fabric.Text(`(${x}, ${-y})`, {
                    top: 20 + opts.label.topOffset,
                    left: 3 + opts.label.leftOffset,
                    fill: 'darkslategray',
                    fontFamily: "ptserif",
                    fontSize: 11,
                });
                var bg = new fabric.Rect({
                    top: opts.label.topOffset,
                    left: opts.label.leftOffset,
                    fill: "rgba(255,250,250,.97)",
                    stroke: isActive ? "lightseagreen" : "white",
                    strokeWidth: 2.5,
                    rx: 5,
                    ry: 5,
                    width: Math.max(l.width, lp.width + 5) + 5,
                    height: opts.label.height,
                });

                return new fabric.Group([pc, bg, l, lp], {
                    top: y + opts.label.topOffset - opts.label.radius,
                    left: x - opts.label.radius,
                });
            });
        });

        // Create area polygons and outline segments around the area polygon.
        let areas = [];
        let outlines = [];
        polys.filter((poly) => poly.points.length > 1 && poly.kind === "outline").forEach((poly) => {
            let lastBiome = undefined;
            let currentOutline = [];
            poly.points.forEach((pt) => {
                if ((pt.biome !== lastBiome) && currentOutline.length > 0) {
                    outlines.push(new fabric.Polyline(currentOutline, {
                        stroke: biomeColor(lastBiome),
                        strokeWidth: 4,
                        strokeLineJoin: "round",
                        fill: noFill,
                    }));
                    currentOutline = [currentOutline[currentOutline.length - 1]];
                    lastBiome = pt.biome;
                }
                currentOutline.push({ x: Number(pt.x), y: -Number(pt.y) });
            });
            if (currentOutline.length > 0) {
                // If the last point and first point are close enough, link them up.
                const lastPt = currentOutline[currentOutline.length - 1];
                const firstPt = { x: Number(poly.points[0].x), y: -Number(poly.points[0].y) }

                // Distance of 100 threshold somewhat arbitrary.
                if (distance(firstPt, lastPt) < 100) {
                    currentOutline.push(firstPt);
                }

                outlines.push(new fabric.Polyline(currentOutline, {
                    stroke: biomeColor(lastBiome),
                    strokeWidth: 4,
                    strokeLineJoin: "round",
                    fill: noFill,
                }));
            }

            let pts = poly.points.map((pt) => {
                return { x: Number(pt.x), y: -Number(pt.y) }
            });
            areas.push(new fabric.Polygon(pts, {
                fill: "#FCFBFB",
                stroke: "#A9A9A9",
                strokeWidth: 5.3, // underlaps outline stroke
                strokeLineJoin: "round",
            }));
        });

        // Create track polylines.
        const tracks = polys.filter((poly) => poly.points.length > 1 && poly.kind === "track").map((poly) => {
            let pts = poly.points.map((pt) => {
                return { x: Number(pt.x), y: -Number(pt.y) }
            });

            return new fabric.Polyline(pts, {
                stroke: "slategray",
                strokeWidth: 1,
                strokeLineJoin: "round",
                fill: noFill,
                strokeDashArray: [6, 3],
            });
        });

        // Add a warning circle, for the night spawn danger range
        const nightSpawnRadius = 2800
        const warning = new fabric.Circle({
            radius: nightSpawnRadius,
            stroke: "#FFC0CB",
            fill: noFill,
            left: -nightSpawnRadius,
            top: -nightSpawnRadius,
            strokeWidth: 1,
            strokeDashArray: [5, 7],
            absolutePositioned: true,
        });

        // Place smaller objects atop larger objects
        areas.sort((x, y) => (x.width * x.height < y.width * y.height) ? 1 : -1);

        // Flatten object arrays and add to canvas in batch
        const flatlabels = labels.flat();
        canvas.add(...areas, ...outlines, ...tracks, ...flatlabels, warning);

        // Once added to canvas, we can examine object intersections
        // Clip smaller objects out of bigger objects when intersecting
        areas.toReversed().forEach((poly, i, others) => {
            let under = others.slice(i + 1).find((other) => {
                if (other === undefined) return false;

                // rough intersection in fabric.js first
                if (poly.isContainedWithinObject(other, true)) {
                    // fine intersection in polygons.js to confirm
                    return intersect(poly.points, other.points).length > 0;
                };
            });

            if (under === undefined) return;

            poly.fill = noFill;
            poly.absolutePositioned = true;
            poly.inverted = true;
            poly.objectCaching = false;
            under.clipPath = poly;
        });

        // Insert into the polyObjects state.
        // This tracks objects so we can remove them before beginning
        // the next drawing loop (when `polys` changes).
        setPolyObjects([...areas, ...outlines, ...tracks, ...flatlabels, warning]);

        // Rerender
        canvas.requestRenderAll();
    }, [canvas, polys]);

    React.useEffect(() => {
        if (activePoint === undefined) return;

        // Remove all existing objects
        // This fixes double (or worse...) drawing
        // objects as things change.
        if (activePointObject !== undefined) {
            canvas.remove(activePointObject);
        }

        const activeRadius = 3;
        const x = Number(activePoint.x);
        const y = -Number(activePoint.y);

        // Point dot
        let pt = new fabric.Circle({
            radius: activeRadius,
            fill: "lightseagreen",
            left: x - activeRadius,
            top: y - activeRadius,
        });
        canvas.add(pt);
        setActivePointObject(pt);

        // Zoom to active point
        zoomPoint(activePoint, .7);
    }, [canvas, activePoint]);

    React.useEffect(() => {
        if (canvas === undefined) return;
        if (pingPoints === undefined || pingPoints.length === 0) return;

        // Remove all existing objects
        // This fixes double (or worse...) drawing
        // objects as things change.
        if (pingObjects !== undefined) {
            canvas.remove(...pingObjects);
        }

        const opacity = 1;
        const pingRadius = 2;
        const circleColors = ["#D14D72", "#FFABAB", "#FCC8D1", "#fcdae0"];

        const pings = pingPoints.toReversed().map((pingPoint, i) => {
            const fade = (opacity - (i * .20));

            let center = new fabric.Circle({
                top: -pingRadius,
                left: -pingRadius,
                radius: pingRadius,
                stroke: "#D80E70",
                fill: "#6B0848",
                strokeWidth: 1,
                absolutePositioned: true,
                opacity: fade
            });

            let rad = pingRadius;
            let radii = circleColors.slice(i).map((color, i) => {
                rad = pingRadius * (i + i + 3);
                return new fabric.Circle({
                    top: -rad,
                    left: -rad,
                    radius: rad,
                    stroke: color,
                    fill: noFill,
                    strokeWidth: 1,
                    absolutePositioned: true,
                    opacity: fade
                });
            });

            return new fabric.Group([center, ...radii], {
                top: -pingPoint.y - rad,
                left: pingPoint.x - rad,
            });
        });
        canvas.add(...pings);
        setPingObjects(pings);

        // Force a single render
        canvas.requestRenderAll();
    }, [canvas, pingPoints]);

    React.useEffect(() => {
        if (canvas === undefined) return;
        if (otherPingPoints === undefined || otherPingPoints.length === 0) return;

        // Remove all existing objects
        // This fixes double (or worse...) drawing
        // objects as things change.
        if (otherPingObjects !== undefined) {
            canvas.remove(...otherPingObjects);
        }

        const opr = 3;
        let groups = otherPingPoints.map(opp => {
            let users = getUser(opp.userId);
            if (users !== undefined && users.length > 0) {
                const user = users[0];
                const x = Number(opp.point.x);
                const y = Number(opp.point.y);

                let otherPingPoint = new fabric.Circle({
                    radius: opr,
                    stroke: "",
                    fill: "purple",
                    absolutePositioned: true,
                });

                let name = new fabric.Text(user.name, {
                    top: -5,
                    left: 10,
                    fill: "black",
                    fontFamily: "valheim",
                    fontSize: 15,
                });

                return new fabric.Group([otherPingPoint, name], {
                    top: -y - opr - 5,
                    left: x - opr,
                });
            };
        });
        canvas.add(...groups);
        setOtherPingObjects(groups);

        // Force a single render
        canvas.requestRenderAll();
    }, [canvas, otherPingPoints]);

    function zoomPoint(point, zm) {
        canvas.setZoom(zm);
        let px = ((canvas.getWidth() / zm / 2) - (Number(point.x))) * zm;
        let py = ((canvas.getHeight() / zm / 2) - (-Number(point.y))) * zm;
        canvas.setViewportTransform([zm, 0, 0, zm, px, py]);
        canvas.requestRenderAll();
    }

    function zoomWheel(ev) {
        let scale = canvas.getZoom();
        let d = (ev.deltaY > 0) ? -.05 : .03;
        let n = scale + d;
        let pt = { x: ev.clientX, y: ev.clientY };

        if (n > 1.5) n = 1.5;
        if (n < 0.1) n = 0.1;

        canvas.zoomToPoint(pt, n);
        canvas.requestRenderAll();
    };

    function pan(ev) {
        if (ev.buttons === 1) {
            canvas.relativePan({ x: ev.movementX, y: ev.movementY });
            canvas.requestRenderAll();
        }
    }

    function saveImage() {
        const link = document.createElement("a");
        link.href = canvas.toDataURL({
            multiplier: 4,
        });
        link.download = "world.png";
        link.click();
        link.remove();
    }

    return (
        <div>
            <canvas ref={cRef} onMouseMove={pan} id="map" onWheel={zoomWheel} />
            <img id="image" src="images/image.svg" onClick={saveImage} />
            <div id="debug">count: {canvas && canvas.size()}</div>
        </div>
    )
}
