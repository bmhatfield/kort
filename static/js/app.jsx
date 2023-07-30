
const App = () => {
    const [polys, setPolys] = React.useState();
    const [mode, setMode] = React.useState("new");
    const [activePolyId, setActivePolyId] = React.useState("");
    const [activePoint, setActivePoint] = React.useState();
    const [pingPoints, setPingPoints] = React.useState([]);
    const [ptLabel, setPtLabel] = React.useState("");
    const [bearer, setBearer] = React.useState(localStorage.getItem("token"));
    const [sidebarVisible, setSidebarVisible] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);
    const [users, setUsers] = React.useState()

    const headers = { "Content-Type": "application/json" }
    if (bearer) {
        headers["Authorization"] = `Bearer ${bearer}`;
    }

    function handleLoginSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target);
        const token = data.get("token");

        if (token) {
            localStorage.setItem("token", token);
            setBearer(token);
        }
    }

    React.useEffect(() => {
        fetch("/users", { headers: headers }).then(res => {
            if (!res.ok) {
                throw new Error(res.statusText, res.body);
            }

            return res.json();
        }).then(json => {
            setUsers(json);
        });

        fetch("/polys", { headers: headers }).then(res => {
            if (!res.ok) {
                throw new Error(res.statusText, res.body);
            }

            return res.json();
        }).then(json => {
            setPolys(json);

            if (json.length > 0) {
                let newest = json.reduce((a, b) => { return Number(a.id) > Number(b.id) ? a : b });
                setActivePolyId(newest.id);
            }

            setTimeout(function () {
                setIsLoading(false);
            }, 150);
        });
    }, [bearer]);

    function append(point) {
        fetch(`/points/${activePolyId}`, { body: JSON.stringify([point]), method: "PUT", headers: headers })
            .then(res => {
                if (!res.ok) {
                    throw new Error(res.statusText, res.body);
                }

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

        fetch("/poly", { body: JSON.stringify(update), method: "POST", headers: headers }
        ).then(res => {
            if (!res.ok) {
                throw new Error(res.statusText, res.body);
            }

            return res.json();
        }).then(json => {
            update.id = json.id;
            setPolys([...polys, update]);
            setActivePolyId(json.id);
            setPtLabel("");
        });
    }

    function handlePointDelete(e, p, i) {
        fetch(`/point/${p}/${i}`, { method: "DELETE", headers: headers })
            .then(res => {
                if (!res.ok) {
                    throw new Error(res.statusText, res.body);
                }

                setPolys(prev => {
                    let active = prev.find(poly => poly.id === activePolyId)
                    active.points.splice(i, 1);
                    return [...prev];
                });
                setPtLabel("");
            });
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
                create(point, data.get("polyKind"));
                break;
            case "append":
                append(point);
                break;
        };
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
    }

    function labelMatch(point, search) {
        return point.label.toLowerCase().includes(search.toLowerCase());
    }

    function canAppend() {
        return activePolyId === undefined || activePolyId === ""
    }

    let userCache = {};
    function getUser(id) {
        if (users === undefined) {
            return
        }
        if (id in userCache) {
            return userCache[id];
        }

        let filtered = users.filter(user => user.id === id);
        userCache[id] = filtered;

        return filtered;
    }

    if (!bearer) {
        return (
            <div id="login">
                <form id="loginform" onSubmit={handleLoginSubmit}>
                    <label htmlFor="token">Token</label>
                    <input id="token" name="token" type="text" />
                    <input type="submit" value="Save" />
                </form>
            </div>
        )
    }

    const polyListProps = {
        activePolyId,
        setActivePolyId,
        activePoint,
        setActivePoint,
        getUser,
        handlePointDelete,
    }

    return (
        <div>
            <Cartograph polys={polys} activePoint={activePoint} pingPoints={pingPoints} />
            <div id="logout" onClick={(e) => { localStorage.removeItem("token"); setPolys(); setBearer(); }}>×</div>
            <div id="ping">
                <form id="pingform" onSubmit={handlePingSubmit}>
                    <label htmlFor="px">x</label><input id="px" name="px" type="number" min="-10000" max="10000" required />
                    <label htmlFor="py">y</label><input id="py" name="py" type="number" min="-10000" max="10000" required />
                    <input type="submit" hidden />
                </form>
            </div>
            <div id="sidebar">
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
                <PolyList polys={polys} {...polyListProps} />
            </div>
            {isLoading && <div id="loading"><span className="loader"></span></div>}
        </div>
    )
}
