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
            fill: "aliceblue",
            left: -circleRadius,
            top: -circleRadius,
            strokeWidth: 2,
            objectCaching: false,
            absolutePositioned: true,
        });
        canvas.add(world);

        // Add a grid, inscribed in the border circle.
        for (var axis = -circleRadius; axis <= circleRadius; axis += circleRadius / 10) {
            let lineParams = {
                stroke: (axis === 0) ? '#aaaaaa' : 'lightgray',
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
        if (polys === undefined) return

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
                    fill: "rgba(255,250,250,.9)",
                    stroke: isActive ? "lightseagreen" : "rgba(255,250,250,.95)",
                    strokeWidth: 2,
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

        // Create polygons
        const polygons = polys.filter((poly) => poly.points.length > 1 && poly.kind === "outline").map((poly) => {
            let pts = poly.points.map((pt) => {
                return { x: Number(pt.x), y: -Number(pt.y) }
            });

            return new fabric.Polygon(pts, {
                stroke: "slategray",
                strokeWidth: 1.4,
                strokeLineJoin: "round",
                fill: "snow",
                objectCaching: false,
            });
        });

        // Create polylines
        const lines = polys.filter((poly) => poly.points.length > 1 && poly.kind === "track").map((poly) => {
            let pts = poly.points.map((pt) => {
                return { x: Number(pt.x), y: -Number(pt.y) }
            });

            return new fabric.Polyline(pts, {
                stroke: "slategray",
                strokeWidth: 1,
                strokeLineJoin: "round",
                fill: noFill,
                strokeDashArray: [6, 3],
                objectCaching: false,
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
            objectCaching: false,
            absolutePositioned: true,
        });

        // Place smaller objects atop larger objects
        polygons.sort((x, y) => (x.width * x.height < y.width * y.height) ? 1 : -1);

        // Flatten object arrays and add to canvas in batch
        const llf = labels.flat();
        canvas.add(...polygons, ...lines, ...llf, warning);

        // Once added to canvas, we can examine object intersections
        // Clip smaller objects out of bigger objects when intersecting
        polygons.toReversed().forEach((poly, i, others) => {
            let under = others.slice(i+1).find((other) => {
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
            under.clipPath = poly;
        });

        setPolyObjects([...polygons, ...lines, ...llf, warning]);

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
        if (pingPoints === undefined) return;

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
        if (otherPingPoints === undefined) return;

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

    return (
        <canvas ref={cRef} onMouseMove={pan} id="map" onWheel={zoomWheel}></canvas>
    )
}
