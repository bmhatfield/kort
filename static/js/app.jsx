
const App = () => {
    const [tables, setTables] = React.useState();
    const [mode, setMode] = React.useState("new");

    React.useEffect(() => {
        fetch("http://localhost:3000/tables.json").then(res => {
            return res.json();
        }).then(json => {
            setTables(json);
        })
    }, []);

    function handleSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target);
        data.append("mode", mode);

        fetch("http://localhost:3000/savepoint", { body: data, method: "POST" })
            .then(() => {
                const point = [data.get("x"), data.get("y")];

                if (mode === "append") {
                    setTables(prev => {
                        let last = prev[prev.length-1];
                        last.push(point);
                        console.log(last);
                        return [...prev.slice(0,-1), last];
                    });
                } else {
                    setTables([...tables, [point]]);
                }
            });
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
                    <input type="submit" value="New" className="sub-mode" style={{marginRight: 25}} onClick={(() => setMode("new"))} />
                </form>
            </div>
        </div>
    )
}
