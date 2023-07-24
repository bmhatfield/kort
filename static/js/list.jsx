const PolyList = ({ polys, activePolyId, setActivePolyId }) => {
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
        newest = polys.reduce((a, b) => {return Number(a.id) > Number(b.id) ? a : b});
    }

    let items = polys.filter(poly => poly.points.length > 1 || poly.id === newest.id).map(poly => {
        let showPoints = (activePolyId === poly.id);
        let points;

        // Get list of points, if active for this poly
        if (showPoints) {
            points = poly.points.map((point, i) => {
                let label = (point.label !== undefined) ? <div>{point.label}</div> : null;
                return (
                    <li className={"pointitem listli"} key={i}>
                        <div>{label}</div>
                        <div>({point.x}, {point.y})</div>
                    </li>
                )
            })
        }

        // Return poly
        return (
            <li className={"listli"} key={poly.id} onClick={()=>{listliClick(poly.id)}}>
                <div className={"polyitem"}>
                    <div className={"polysize"}>{poly.points.length}</div>
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
