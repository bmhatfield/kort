
const App = () => {
    const [tables, setTables] = React.useState();

    React.useEffect(() => {
        fetch("http://localhost:3000/tables.json").then(res => {
            return res.json();
        }).then(json => {
            setTables(json);
        })
    }, []);

    function handleSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target)

        fetch("http://localhost:3000/savepoint", { body: data, method: "POST" })
            .then(() => {
                setTables([...tables, [[data.get("x"), data.get("y")]]]);
            });
    }

    return (
        <div>
            <Cartograph tables={tables} />
            <div id="fcontainer">
                <form id="points" onSubmit={handleSubmit}>
                    <div><label htmlFor="x">x</label><input id="x" name="x" type="number" min="-10000" max="10000" /></div>
                    <div><label htmlFor="y">y</label><input id="y" name="y" type="number" min="-10000" max="10000" /></div>
                    <div><label htmlFor="label">label</label><input type="text" id="label" name="label" /></div>
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
                    <input type="submit" />
                </form>
            </div>
        </div>
    )
}
