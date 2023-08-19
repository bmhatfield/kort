const Sidebar = ({ children, create, append, polys, activePolyId, setActivePoint }) => {
    const sidebarOpenKey = "sidebar-open";
    const sidebarInit = localStorage.getItem(sidebarOpenKey);
    const [sidebarOpen, setSidebarOpen] = React.useState((sidebarInit === null || sidebarInit === 'true'));
    const [ptLabel, setPtLabel] = React.useState("");

    const pform = React.useRef(null);

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

    function toPoint(form) {
        const data = new FormData(form);
        return {
            x: data.get("x"),
            y: data.get("y"),
            label: data.get("label"),
            biome: data.get("biome"),
        };
    }

    function handlePolyAppend(e) {
        e.preventDefault();

        const point = toPoint(e.target);

        setActivePoint(point);
        append(point).then(() => { setPtLabel("") });
    }

    function handlePolyCreate(kind) {
        const point = toPoint(pform.current);

        setActivePoint(point);
        create(point, kind).then(() => { setPtLabel("") });
    }

    return (
        <div id="sidebar" className={sidebarOpen ? "sidebar-open" : "sidebar-closed"}>
            <div id="sidebarshrink" onClick={() => { localStorage.setItem(sidebarOpenKey, !sidebarOpen); setSidebarOpen(!sidebarOpen) }}>{sidebarOpen ? "«" : "»"}</div>
            <div id="search">
                <form id="searchform" onSubmit={handleSearchSubmit}>
                    <input type="text" id="searchbox" name="searchbox" placeholder="search" autoComplete="off" />
                </form>
            </div>
            <div id="newpoint">
                <form ref={pform} id="pointform" onSubmit={handlePolyAppend}>
                    <div id="pointrow">
                        <div><label htmlFor="x">x</label><input id="x" name="x" type="number" min="-10000" max="10000" required /></div>
                        <div><label htmlFor="y">y</label><input id="y" name="y" type="number" min="-10000" max="10000" required /></div>
                    </div>
                    <div><label htmlFor="label">label</label><input type="text" id="label" name="label" autoComplete="off" value={ptLabel} onChange={(e) => setPtLabel(e.target.value)} /></div>
                    <div>
                        <label htmlFor="biome">biome</label>
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
                    <div id="buttonrow">
                        <input type="submit" value="Append" name="append" className="append-btn" disabled={canAppend()} />
                        <div className="dropdown">
                            <button className="dropbtn" onClick={(e) => e.preventDefault()}>New</button>
                            <ul className="dropdown-menu">
                                <li onClick={(e) => handlePolyCreate("marker")}>Marker</li>
                                <li onClick={(e) => handlePolyCreate("track")}>Track</li>
                                <li onClick={(e) => handlePolyCreate("outline")}>Outline</li>
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
            {children}
        </div>
    )
}
