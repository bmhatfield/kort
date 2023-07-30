const Sidebar = ({list, create, append, polys, activePolyId, setActivePoint}) => {
    const [mode, setMode] = React.useState("new");
    const [sidebarVisible, setSidebarVisible] = React.useState(true);
    const [ptLabel, setPtLabel] = React.useState("");
    const [sidebarClass, setSidebarClass] = React.useState("sidebar-open");
    const [shrinkButton, setShrinkButton] = React.useState("«")

    function labelMatch(point, search) {
        return point.label.toLowerCase().includes(search.toLowerCase());
    }

    function canAppend() {
        return activePolyId === undefined || activePolyId === ""
    }

    function handleSearchSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target);
        const search = data.get("searchbox");

        let matches = polys.filter(poly => {
            return poly.points.some(point => point.label && labelMatch(point, search))
        }).map(poly => {
            return poly.points.filter(point => {
                return point.label && labelMatch(point, search);
            });
        });

        if (matches && matches.length > 0 && matches[0].length > 0) {
            setActivePoint(matches[0][0]);
        }
    }

    function handlePointSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target);
        const point = {
            x: data.get("x"),
            y: data.get("y"),
            label: data.get("label"),
            biome: data.get("biome"),
        };

        setActivePoint(point);

        switch (mode) {
            case "new":
                create(point, data.get("polyKind")).then(() => { setPtLabel("") });
                break;
            case "append":
                append(point).then(() => { setPtLabel("") });
                break;
        };
    }

    function handleShrink(e) {
        if (sidebarVisible) {
            setSidebarVisible(false);
            setShrinkButton("»");
            setSidebarClass("sidebar-closed");
            return
        }

        setSidebarVisible(true);
        setShrinkButton("«");
        setSidebarClass("sidebar-open");
    }

    return (
        <div id="sidebar" className={sidebarClass}>
            <div id="sidebarshrink" onClick={handleShrink}>{shrinkButton}</div>
            <div id="search">
                <form id="searchform" onSubmit={handleSearchSubmit}>
                    <input type="text" id="searchbox" name="searchbox" placeholder="search" autoComplete="off" />
                </form>
            </div>
            <div id="newpoint">
                <form id="pointform" onSubmit={handlePointSubmit}>
                    <div><label htmlFor="x">x</label><input id="x" name="x" type="number" min="-10000" max="10000" required /></div>
                    <div><label htmlFor="y">y</label><input id="y" name="y" type="number" min="-10000" max="10000" required /></div>
                    <div><label htmlFor="label">label</label><input type="text" id="label" name="label" autoComplete="off" value={ptLabel} onChange={(e) => setPtLabel(e.target.value)} /></div>
                    <div><label htmlFor="biome">biome</label>
                        <select id="biome" name="biome" defaultValue={"ocean"}>
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
                            <option value="outline">Outline</option>
                            <option value="track">Track</option>
                            <option value="marker">Marker</option>
                        </select>
                    </div>
                    <input type="submit" value="Append" className="sub-mode" disabled={canAppend()} onClick={(() => setMode("append"))} />
                    <input type="submit" value="New" className="sub-mode" onClick={(() => setMode("new"))} />
                </form>
            </div>
            {list}
        </div>
    )
}
