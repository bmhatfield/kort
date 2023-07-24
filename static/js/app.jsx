
const App = () => {
    const [polys, setPolys] = React.useState();
    const [mode, setMode] = React.useState("new");
    const [activePolyId, setActivePolyId] = React.useState("");

    const [ptLabel, setPtLabel] = React.useState("");

    React.useEffect(() => {
        fetch("http://localhost:3000/polys").then(res => {
            return res.json();
        }).then(json => {
            setPolys(json);

            if (json.length > 0) {
                console.log(json);
                let newest = json.reduce((a, b) => { return Number(a.id) > Number(b.id) ? a : b });
                setActivePolyId(newest.id);
            }
        })
    }, []);

    function append(point) {
        const update = {
            id: activePolyId,
            points: [point],
        };

        fetch("http://localhost:3000/poly", { body: JSON.stringify(update), method: "PATCH" })
            .then(res => {
                setPolys(prev => {
                    let active = prev.find(poly => poly.id === activePolyId)
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

        fetch("http://localhost:3000/poly", { body: JSON.stringify(update), method: "POST" }
        ).then(res => {
            return res.json();
        }).then(json => {
            update.id = json.id;
            setPolys([...polys, update]);
            setActivePolyId(json.id);
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
                create(point, data.get("polyKind"));
                break;
            case "append":
                append(point);
                break;
        };
    }

    function canAppend() {
        return activePolyId === undefined || activePolyId === ""
    }

    return (
        <div>
            <Cartograph polys={polys} />
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
                    <div><label htmlFor="polyKind">kind</label>
                        <select id="polyKind" name="polyKind" defaultValue={"track"}>
                            <option value="">None</option>
                            <option value="outline">Outline</option>
                            <option value="track">Track</option>
                            <option value="marker">Marker</option>
                        </select>
                    </div>
                    <input type="submit" value="Append" className="sub-mode" disabled={canAppend()} onClick={(() => setMode("append"))} />
                    <input type="submit" value="New" className="sub-mode" style={{ marginRight: 25 }} onClick={(() => setMode("new"))} />
                </form>
            </div>
            <PolyList polys={polys} activePolyId={activePolyId} setActivePolyId={setActivePolyId} />
        </div>
    )
}
