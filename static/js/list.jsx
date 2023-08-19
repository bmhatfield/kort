const PolyList = ({ polys, activePolyId, setActivePolyId, activePoint, setActivePoint, getUser, remove }) => {
    const listOpenKey = "list-open";
    const listOpenInit = localStorage.getItem(listOpenKey);
    const [listOpen, setListOpen] = React.useState((listOpenInit === null || listOpenInit === 'true'));

    if (polys === undefined) {
        return
    }

    function isActivePoly(polyId) {
        return (activePolyId === polyId);
    }

    function isActivePoint(point) {
        return (activePoint !== undefined && activePoint.x === point.x && activePoint.y === point.y);
    }

    function listliClick(polyId) {
        if (isActivePoly(polyId)) {
            setActivePolyId("");
            return
        }

        setActivePolyId(polyId);
    }

    let newest;
    if (polys.length > 0) {
        newest = polys.reduce((a, b) => { return Number(a.id) > Number(b.id) ? a : b });
    }

    let items = polys.filter(poly => {
        return poly.points.length > 1 || poly.id === newest.id;
    }).toSorted((a, b) => {
        const an = Number(a.id);
        const bn = Number(b.id);

        // Reversed
        if (an > bn) return -1;
        if (bn > an) return 1;
        return 0;
    }).map(poly => {
        let showPoints = (activePolyId === poly.id);
        let points;

        // Get list of points, if active for this poly
        if (showPoints) {
            points = poly.points.map((point, i) => {
                const pointClass = isActivePoint(point) ? "pointitem activepoint" : "pointitem"
                const pointStyle = {
                    "backgroundColor": `color-mix(in srgb, ${biomeColor(point.biome)} 15%, white)`,
                };

                let label = (point.label !== undefined) ? <div>{point.label}</div> : null;
                return (
                    <li style={pointStyle} className={pointClass} key={i} onClick={() => setActivePoint(point)}>
                        <div>{label}</div>
                        <div>({point.x}, {point.y})</div>
                        <div className={"pointdel"} key={i} onClick={() => remove(poly.id, i)}>delete</div>
                    </li>
                )
            })
        }

        const users = getUser(poly.userId);

        // Return poly
        return (
            <li key={poly.id}>
                <div className={"polyitem" + (isActivePoly(poly.id) ? " activepolyitem" : "")} onClick={() => { listliClick(poly.id) }}>
                    <div className={"polysize"}>{poly.points.length}</div>
                    <div>{users && users.length > 0 && users[0].name}</div>
                    <div>{poly.kind}</div>
                </div>
                {showPoints && <ul className={"pointset"}>{points}</ul>}
            </li>
        );
    });

    return (
        <div id="listcontainer">
            <div id="listshrink" onClick={() => { localStorage.setItem(listOpenKey, !listOpen); setListOpen(!listOpen); }}>
                <img id="shrinkarrow" className={listOpen ? "flipY" : ""} src="/images/down-arrow.png" height="8px"></img>
            </div>
            <ul id="list" className={"thinscroll" + (listOpen ? " list-open" : " list-closed")}>
                {items}
            </ul>
        </div>
    )
}
