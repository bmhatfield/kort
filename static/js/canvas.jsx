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
            viewportTransform: [scale, 0, 0, scale, (width / 2), (height / 2)],
            renderOnAddRemove: false,
        });
        setCanvas(canvas);

        const circleRadius = 10000;
        let border = new fabric.Circle({
            radius: circleRadius,
            stroke: "slategray",
            fill: "",
            left: -circleRadius,
            top: -circleRadius,
            strokeWidth: 2,
            objectCaching: false,
            absolutePositioned: true,
        });
        canvas.add(border);

        // Add a grid, inscribed in the border circle.
        for (var axis = -circleRadius; axis <= circleRadius; axis += circleRadius / 10) {
            let lineParams = {
                stroke: (axis === 0) ? '#aaaaaa' : 'lightgray',
                clipPath: border
            }
            canvas.add(new fabric.Line([axis, -circleRadius, axis, circleRadius], lineParams));
            canvas.add(new fabric.Line([-circleRadius, axis, circleRadius, axis], lineParams));
        }

        if (polys === undefined) {
            return
        }

        // Settings
        const opts = {
            activeRadius: 3,
            label: {
                radius: 1.7,
                height: 34,
                leftOffset: 8,
                topOffset: -(34 / 2),
            }
        };

        // Render polys
        polys.map((poly, i) => {
            // Draw Points
            let pts = poly.points.map((p, i) => {
                const x = Number(p.x);
                const y = -Number(p.y); // Inverted for drawing due to canvas coords

                const isActive = activePoint !== undefined && activePoint.x === p.x && activePoint.y === p.y;
                const isLabeled = p.label !== undefined && p.label.length > 0;

                // Point dot
                if (isActive) {
                    let pt = new fabric.Circle({
                        radius: opts.activeRadius,
                        fill: "lightseagreen",
                        left: x - opts.activeRadius,
                        top: y - opts.activeRadius,
                    });
                    canvas.add(pt);
                }

                // Point label
                if (isLabeled) {
                    var pc = new fabric.Circle({
                        radius: opts.label.radius,
                        fill: "slategray",
                        visible: !isActive,
                    });
                    var l = new fabric.Text(p.label, {
                        top: opts.label.topOffset,
                        left: 3 + opts.label.leftOffset,
                        fill: 'black',
                        fontFamily: "valheim",
                        fontSize: 20,
                        selectable: true,
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
                        fill: "rgba(255,250,250,.7)",
                        stroke: isActive ? "lightseagreen" : "rgba(255,250,250,.9)",
                        strokeWidth: 2,
                        rx: 5,
                        ry: 5,
                        width: Math.max(l.width, lp.width + 5) + 5,
                        height: opts.label.height,
                    });
                    var group = new fabric.Group([pc, bg, l, lp], {
                        top: y + opts.label.topOffset - opts.label.radius,
                        left: x - opts.label.radius,
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
                    strokeWidth: (poly.kind === "outline") ? 1.4 : 1,
                    strokeLineJoin: "round",
                    fill: "",
                    strokeDashArray: (poly.kind === "track") ? [6, 3] : undefined,
                    objectCaching: false,
                });
                canvas.add(line);
            }
        });

        // Force a single render
        canvas.renderAll();
    }, [polys, activePoint, cRef]);

    React.useEffect(() => {
        if (activePoint !== undefined) {
            // Zoom to active point
            zoomPoint(activePoint, .7);
        }
    });

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
