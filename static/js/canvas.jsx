const Cartograph = ({ polys, activePoint }) => {
    const [canvas, setCanvas] = React.useState();

    const cRef = React.useRef();

    React.useEffect(() => {
        const scale = 0.25;

        const height = window.innerHeight;
        const width = window.innerWidth
        var canvas = new fabric.StaticCanvas(cRef.current, {
            height: height,
            width: width,
            viewportTransform: [scale, 0, 0, scale, (width / 2), (height / 2)]
        });
        setCanvas(canvas);

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
        let gridClipPath = new fabric.Circle({
            radius: circleRadius,
            left: -circleRadius,
            top: -circleRadius,
            absolutePositioned: true
        });
        for (var axis = -circleRadius; axis <= circleRadius; axis += circleRadius / 10) {
            let lineParams = {
                stroke: 'lightgray',
                clipPath: gridClipPath
            }
            canvas.add(new fabric.Line([axis, -circleRadius, axis, circleRadius], lineParams));
            canvas.add(new fabric.Line([-circleRadius, axis, circleRadius, axis], lineParams));
        }

        if (polys === undefined) {
            return
        }

        // Render polys
        const ptRadius = 1;
        polys.map((poly, i) => {
            // Draw Points
            let pts = poly.points.map((p, i) => {
                const x = Number(p.x);
                const y = -Number(p.y); // Inverted for drawing due to canvas coords

                const isActive = activePoint !== undefined && activePoint.x === p.x && activePoint.y === p.y;

                // Point dot
                const radius = isActive ? ptRadius * 3 : ptRadius;
                let pt = new fabric.Circle({
                    radius: radius,
                    fill: "slategray",
                    left: x - radius,
                    top: y - radius,
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
                        stroke: isActive ? "lightseagreen" : "rgba(255,250,250,.9)",
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
    }, [polys, activePoint, cRef]);

    React.useEffect(() => {
        if (activePoint !== undefined) {
            // Zoom to active point
            zoomCanvas(activePoint, .7);
        }
    });

    function zoomCanvas(point, zm) {
        canvas.setZoom(zm);
        let px = ((canvas.getWidth() / zm / 2) - (Number(point.x))) * zm;
        let py = ((canvas.getHeight() / zm / 2) - (-Number(point.y))) * zm;
        canvas.setViewportTransform([zm, 0, 0, zm, px, py]);
    }

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

    return (
        <canvas ref={cRef} onMouseMove={pan} id="map" onWheel={zoom}></canvas>
    )
}
