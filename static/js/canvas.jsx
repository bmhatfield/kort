const Cartograph = ({ polys }) => {
    const [canvas, setCanvas] = React.useState();

    const cRef = React.useRef();

    React.useEffect(() => {
        if (polys === undefined) {
            return
        }

        const scale = 0.25;

        const height = window.innerHeight;
        const width = window.innerWidth
        var canvas = new fabric.StaticCanvas(cRef.current, {
            height: height,
            width: width,
            viewportTransform: [scale, 0, 0, scale, (width / 2), (height / 2)]
        });
        setCanvas(canvas);

        const ptRadius = 1;

        const circleRadius = 10000;
        let border = new fabric.Circle({
            radius: circleRadius,
            stroke: "slategray",
            fill: "",
            left: -circleRadius,
            top: -circleRadius,
            strokeWidth: 1,
        });
        canvas.add(border);

        // Add a grid, inscribed in the border circle.
        for (var axis = -circleRadius; axis <= circleRadius; axis += circleRadius / 10) {
            let intersections = findCircleLineIntersections(circleRadius, axis);
            if (intersections.length == 0) continue;

            let gridx = new fabric.Line([axis, intersections[0], axis, intersections[1]], {
                stroke: 'grey'
            });
            canvas.add(gridx);
            let gridy = new fabric.Line([intersections[0], axis, intersections[1], axis], {
                stroke: 'grey'
            });
            canvas.add(gridy);
        }

        // Render polys
        polys.map((poly, i) => {
            // Draw Points
            let pts = poly.points.map((p, i) => {
                const x = Number(p.x);
                const y = -Number(p.y); // Inverted for drawing due to canvas coords

                // Point dot
                let pt = new fabric.Circle({
                    radius: ptRadius,
                    fill: "slategray",
                    left: x - ptRadius,
                    top: y - ptRadius,
                });
                canvas.add(pt);

                // Point label
                if (p.label !== undefined && p.label.length > 0) {
                    var l = new fabric.Text(p.label, {
                        fill: 'black',
                        left: 3,
                        fontFamily: "valheim",
                        fontSize: 20,
                        selectable: true,
                    });
                    var lp = new fabric.Text(`(${x}, ${-y})`, {
                        fill: 'darkslategray',
                        top: 20,
                        left: 3,
                        fontFamily: "ptserif",
                        fontSize: 11,
                    });
                    var bg = new fabric.Rect({
                        fill: "rgba(255,250,250,.7)",
                        stroke: "rgba(255,250,250,.9)",
                        strokeWidth: 2,
                        rx: 5,
                        ry: 5,
                        width: Math.max(l.width, lp.width + 5) + 5,
                        height: 32,
                    });
                    var group = new fabric.Group([bg, l, lp], {
                        left: x + 10,
                        top: y - 20,
                    });
                    canvas.add(group);
                }

                // For line drawing
                return { x: x, y: y };
            });

            // Draw lines
            if (pts.length > 1) {
                let line = new fabric.Polyline(pts, {
                    stroke: "slategray",
                    strokeWidth: 1,
                    fill: "",
                    strokeDashArray: (poly.kind === "track") ? [6, 3] : undefined,
                    objectCaching: false,
                });

                canvas.add(line);
            }
        });
    }, [polys, cRef]);

    function zoom(ev) {
        let scale = canvas.getZoom();
        let d = (ev.deltaY > 0) ? -.05 : .03;
        let n = scale + d;
        let pt = { x: ev.clientX, y: ev.clientY };

        if (n > 1.5) n = 1.5;
        if (n < 0.1) n = 0.1;

        canvas.zoomToPoint(pt, n);
    };

    function pan(ev) {
        if (ev.buttons === 1) {
            canvas.relativePan({ x: ev.movementX, y: ev.movementY });
        }
    }

    function sq(v) { return Math.pow(v, 2); }

    function findCircleLineIntersections(r, n) {
        // r: circle radius
        // n: y-intercept
        var c = sq(n) - sq(r);
        var discriminant = -4 * c;
        if (discriminant < 0) {
            return [];
        }
        return [
            (Math.sqrt(-4 * c)) / (2),
            (-Math.sqrt(-4 * c)) / (2)
        ];
    }

    return (
        <canvas ref={cRef} onMouseMove={pan} id="map" onWheel={zoom}></canvas>
    )
}
