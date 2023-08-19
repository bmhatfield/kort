const Ping = ({ setActivePoint, setPingPoints, pingPoints, headers }) => {
    function handlePingSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target);
        const x = Number(data.get("px"));
        const y = Number(data.get("py"));

        const point = {
            x: x,
            y: y,
        };
        setActivePoint(point);
        setPingPoints([
            ...pingPoints.slice(-4),  // keep last 4 points
            point
        ]);

        fetch("/ping", { method: "PUT", headers: headers, body: JSON.stringify([{ x: data.get("px"), y: data.get("py") }]) });
    }

    return (
        <div id="ping">
            <form id="pingform" onSubmit={handlePingSubmit}>
                <label htmlFor="px">x</label><input id="px" name="px" type="number" min="-10000" max="10000" required />
                <label htmlFor="py">y</label><input id="py" name="py" type="number" min="-10000" max="10000" required />
                <input type="submit" hidden />
            </form>
        </div>
    );
}
