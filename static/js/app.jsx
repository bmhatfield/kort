
const App = () => {
    const [tables, setTables] = React.useState();
    const [mode, setMode] = React.useState("new");
    const [activeTableId, setActiveTableId] = React.useState("");

    const [ptLabel, setPtLabel] = React.useState("");

    React.useEffect(() => {
        fetch("http://localhost:3000/tables").then(res => {
            return res.json();
        }).then(json => {
            setTables(json);

            var newest = json.reduce(
                function (a, b) {
                    return Number(a.id) > Number(b.id) ? a : b;
                }
            );
            setActiveTableId(newest.id);
        })
    }, []);

    function append(point) {
        const update = {
            id: activeTableId,
            points: [point],
        };

        fetch("http://localhost:3000/table", { body: JSON.stringify(update), method: "PATCH" })
            .then(res => {
                setTables(prev => {
                    let active = prev.find(table => table.id === activeTableId)
                    active.points.push(point);
                    return [...prev];
                });
                setPtLabel("");
            });
    }

    function create(point, kind) {
        let update = {
            kind: kind,
            points: [point],
        };

        fetch("http://localhost:3000/table", { body: JSON.stringify(update), method: "POST" }
        ).then(res => {
            return res.json();
        }).then(json => {
            update.id = json.id;
            setTables([...tables, update]);
            setActiveTableId(json.id);
            setPtLabel("");
        });
    }

    function handleSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target);
        const point = {
            x: data.get("x"),
            y: data.get("y"),
            label: data.get("label"),
            biome: data.get("biome"),
        };

        switch (mode) {
            case "new":
                create(point, data.get("tableKind"));
                break;
            case "append":
                append(point);
                break;
        };
    }

    function canAppend() {
        return activeTableId === undefined || activeTableId === ""
    }

    return (
        <div>
            <Cartograph tables={tables} />
            <div id="pointformcontainer">
                <form id="pointform" onSubmit={handleSubmit}>
                    <div><label htmlFor="x">x</label><input id="x" name="x" type="number" min="-10000" max="10000" required /></div>
                    <div><label htmlFor="y">y</label><input id="y" name="y" type="number" min="-10000" max="10000" required /></div>
                    <div><label htmlFor="label">label</label><input type="text" id="label" name="label" autoComplete="off" value={ptLabel} onChange={(e) => setPtLabel(e.target.value)} /></div>
                    <div><label htmlFor="biome">biome</label>
                        <select id="biome" name="biome" defaultValue={"ocean"}>
                            <option value="">None</option>
                            <option value="meadows">Meadows</option>
                            <option value="forest">Black Forest</option>
                            <option value="swamp">Swamp</option>
                            <option value="mountain">Mountain</option>
                            <option value="ocean">Ocean</option>
                            <option value="plains">Plains</option>
                            <option value="mistlands">Mistlands</option>
                            <option value="north">Deep North</option>
                            <option value="ashlands">Ashlands</option>
                        </select>
                    </div>
                    <div><label htmlFor="tableKind">kind</label>
                        <select id="tableKind" name="tableKind" defaultValue={"track"}>
                            <option value="">None</option>
                            <option value="outline">Outline</option>
                            <option value="track">Track</option>
                        </select>
                    </div>
                    <input type="submit" value="Append" className="sub-mode" disabled={canAppend()} onClick={(() => setMode("append"))} />
                    <input type="submit" value="New" className="sub-mode" style={{ marginRight: 25 }} onClick={(() => setMode("new"))} />
                </form>
            </div>
            <TableList tables={tables} activeTableId={activeTableId} setActiveTableId={setActiveTableId} />
        </div>
    )
}
