const Cartograph = ({ tables }) => {
    const [scale, setScale] = React.useState(0.25);

    const canvasRef = React.useRef();

    React.useEffect(() => {
        if (tables === undefined) {
            return
        }

        const canvas = canvasRef.current;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;


        var ctx = canvas.getContext("2d");

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Reset everything
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.setTransform(1, 0, 0, -1, w / 2, h / 2);
        ctx.translate(0.5, 0.5);
        ctx.save();

        // World boundary
        ctx.beginPath();
        ctx.scale(scale, scale);
        ctx.arc(0, 0, 10000, 0, 2 * Math.PI);
        ctx.restore();
        ctx.strokeStyle="slategray";
        ctx.stroke();
        ctx.save();

        // Render tables
        tables.map((table, i) => {
            // Draw points
            table.points.map((p, i) => {
                ctx.scale(scale, scale);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
                ctx.restore();
                ctx.fill();
                ctx.save();
            });

            // Draw lines
            ctx.beginPath();
            ctx.scale(scale, scale);
            table.points.map((p, i) => {
                if (i === 0) {
                    ctx.moveTo(p.x, p.y);
                }

                if (table.points.length > 1) {
                    ctx.lineTo(p.x, p.y);
                }
            });
            ctx.restore();
            ctx.strokeStyle="black";
            ctx.stroke();
            ctx.save();
        });
    }, [tables, scale, canvasRef])

    function zoom(ev) {
        let d = (ev.deltaY > 0) ? -.05 : .03;
        let n = scale + d;
        if (n < 0.05 && scale > 0.05) {
            setScale(0.05);
            return;
        }

        if (n > 1.1 && scale < 1.1) {
            setScale(1.1);
            return;
        }

        if (n >= 0.05 && n < 1.1) {
            setScale(n);
        }
    }

    return (
        <canvas ref={canvasRef} id="map" onWheel={zoom}></canvas>
    )
}
