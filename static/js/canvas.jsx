const Cartograph = ({tables}) => {
    const [scale, setScale] = React.useState(0.25);

    const canvasRef = React.useRef();

    React.useEffect(() => {
        if (tables === undefined) {
            return
        }

        const canvas = canvasRef.current;
        var ctx = canvas.getContext("2d");

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Reset everything
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.setTransform(1, 0, 0, -1, w / 2, h / 2);

        // Render tables
        tables.map((table, i) => {
            ctx.save();
            ctx.scale(scale, scale);

            // Build table path
            ctx.beginPath();
            table.map((r, i) => {
                const x = Number(r[0]);
                const y = Number(r[1]);

                if (i === 0) {
                    ctx.moveTo(x, y);
                }

                if (table.length > 1) {
                    ctx.lineTo(x, y);
                }

                let pt = new Path2D();
                pt.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill(pt);
            });

            // Stroke
            ctx.restore();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.1;
            ctx.stroke();
        });
    }, [tables, scale, canvasRef])

    function zoom(ev) {
        let d = (ev.deltaY > 0) ? -.05 : .03;
        let n = scale + d;
        if (n > 0.05 && n < 1) {
            setScale(n);
        }
    }

    return (
        <canvas ref={canvasRef} id="map" width="1200" height="1200" onWheel={zoom}></canvas>
    )
}
