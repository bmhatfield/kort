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

        const ptRadius = 1 / canvas.getZoom();

        let border = new fabric.Circle({
            radius: 10000,
            stroke: "slategray",
            fill: "",
            left: -10000,
            top: -10000,
            strokeWidth: 1 / canvas.getZoom(),
        });
        canvas.add(border);

        // Render tables
        tables.map((table, i) => {
            // Draw points
            // Draw lines
            let pts = table.points.map((p, i) => {
                const x = Number(p.x);
                const y = -Number(p.y);

                let pt = new fabric.Circle({
                    radius: ptRadius,
                    fill: "slategray",
                    left: x - ptRadius,
                    top: y - ptRadius,
                });
                canvas.add(pt);

                if (p.label.length > 0) {
                    var l = new fabric.Text(p.label, {
                        fill: 'black',
                        // left:group.left-(group.width/2),
                        // top:group.top-(group.height/2),
                        // left: x+10,
                        // top: y-10,
                        left: 3,
                        fontFamily: "valheim",
                        fontSize: 20,
                    });
                    var lp = new fabric.Text(`(${x}, ${y})`, {
                        fill: 'midnightblue',
                        // left: x+10,
                        // top: y+10,
                        top: 20,
                        left: 3,
                        fontFamily: "valheim",
                        fontSize: 15,
                    });
                    var bg = new fabric.Rect({
                        fill: "snow",
                        rx: 5,
                        ry: 5,
                        width: Math.max(l.width, lp.width)+5,
                        height:37,
                    });
                    var group = new fabric.Group([ bg, l, lp ], {
                        left: x+10,
                        top: y-20,
                    });
                    canvas.add(group);
                }

                return { x: x, y: y };
            });

            let line = new fabric.Polyline(pts, {
                stroke: "slategray",
                strokeWidth: 1 / canvas.getZoom(),
                fill: "",
            });
            canvas.add(line);
        });
    }, [tables, cRef]);

    function zoom(ev) {
        let scale = canvas.getZoom();
        let d = (ev.deltaY > 0) ? -.05 : .03;
        let n = scale + d;
        let pt = {x: ev.clientX, y: ev.clientY};

        if (n > 1.5) n = 1.5;
        if (n < 0.1) n = 0.1;

        canvas.zoomToPoint(pt, n);
    };

    function pan(ev) {
        if (ev.buttons === 1) {
            canvas.relativePan({x: ev.movementX, y: ev.movementY});
        }
    }

    return (
        <canvas ref={cRef} onMouseMove={pan} id="map" onWheel={zoom}></canvas>
    )
}
