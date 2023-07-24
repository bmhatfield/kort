const Cartograph = ({ tables }) => {
    const [canvas, setCanvas] = React.useState();

    const cRef = React.useRef();

    React.useEffect(() => {
        if (tables === undefined) {
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

        let border = new fabric.Circle({
            radius: 10000,
            stroke: "slategray",
            fill: "",
            left: -10000,
            top: -10000,
            strokeWidth: 1,
        });
        canvas.add(border);

        // Render tables
        tables.map((table, i) => {
            // Draw Points
            let pts = table.points.map((p, i) => {
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
                        width: Math.max(l.width, lp.width+5) + 5,
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
                    strokeDashArray: (table.kind === "track") ? [6, 3] : undefined,
                    objectCaching: false,
                });

                canvas.add(line);
            }
        });
    }, [tables, cRef]);

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
