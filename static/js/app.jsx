
const App = () => {
    const [tables, setTables] = React.useState();
    const [mode, setMode] = React.useState("new");

    React.useEffect(() => {
        fetch("http://localhost:3000/tables").then(res => {
            return res.json();
        }).then(json => {
            setTables(json);
        })
    }, []);

    function append(point) {
        const update = {
            id: tables[tables.length - 1].id,
            points: [point],
        };

        fetch("http://localhost:3000/table", { body: JSON.stringify(update), method: "PATCH" })
            .then(res => {
                setTables(prev => {
                    let last = prev[prev.length - 1];
                    last.points.push(point);
                    console.log(last);
                    return [...prev.slice(0, -1), last];
                });
            });
    }

    function create(point) {
        let update = {
            points: [point],
        };

        fetch("http://localhost:3000/table", { body: JSON.stringify(update), method: "POST" }
        ).then(res => {
            return res.json();
        }).then(json => {
            update.id = json.id;
            setTables([...tables, update]);
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
                create(point);
                break;
            case "append":
                append(point);
                break;
        };
    }

    return (
        <div>
            <Cartograph tables={tables} />
            <div id="fcontainer">
                <form id="points" onSubmit={handleSubmit}>
                    <div><label htmlFor="x">x</label><input id="x" name="x" type="number" min="-10000" max="10000" required /></div>
                    <div><label htmlFor="y">y</label><input id="y" name="y" type="number" min="-10000" max="10000" required /></div>
                    <div><label htmlFor="label">label</label><input type="text" id="label" name="label" autoComplete="off" /></div>
                    <div><label htmlFor="biome">biome</label>
                        <select id="biome" name="biome">
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
                    <input type="submit" value="Append" className="sub-mode" onClick={(() => setMode("append"))} />
                    <input type="submit" value="New" className="sub-mode" style={{ marginRight: 25 }} onClick={(() => setMode("new"))} />
                </form>
            </div>
        </div>
    )
}
