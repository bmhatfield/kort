const PolyList = ({ polys, activePolyId, setActivePolyId, activePoint, setActivePoint, getUser, handlePointDelete }) => {
    if (polys === undefined) {
        return
    }

    function listliClick(polyId) {
        if (activePolyId === polyId) {
            setActivePolyId("");
            return
        }

        setActivePolyId(polyId);
    }

    let newest;
    if (polys.length > 0) {
        newest = polys.reduce((a, b) => { return Number(a.id) > Number(b.id) ? a : b });
    }

    let items = polys.filter(poly => poly.points.length > 1 || poly.id === newest.id).map(poly => {
        let showPoints = (activePolyId === poly.id);
        let points;

        // Get list of points, if active for this poly
        if (showPoints) {
            points = poly.points.map((point, i) => {
                const isActive = activePoint !== undefined && activePoint.x === point.x && activePoint.y === point.y;

                let className = "pointitem listli";
                if (isActive) {
                    className += " activepoint";
                }

                let label = (point.label !== undefined) ? <div>{point.label}</div> : null;
                return (
                    <li className={className} key={i} onClick={(e) => setActivePoint(point)}>
                        <div>{label}</div>
                        <div>({point.x}, {point.y})</div>
                        <div className={"pointdel"} key={i} onClick={(e) => handlePointDelete(e, poly.id, i)}>delete</div>
                    </li>
                )
            })
        }

        const users = getUser(poly.userId);

        // Return poly
        return (
            <li className={"listli"} key={poly.id}>
                <div className={"polyitem"} onClick={() => { listliClick(poly.id) }}>
                    <div className={"polysize"}>{poly.points.length}</div>
                    <div>{users && users.length > 0 && users[0].name}</div>
                    <div>{poly.kind}</div>
                </div>
                {showPoints && <ul className={"pointset"}>{points}</ul>}
            </li>
        )
    });

    return (
        <ul id="list">
            {items}
        </ul>
    )
}
