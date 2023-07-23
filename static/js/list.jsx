const TableList = ({ tables, activeTableId, setActiveTableId }) => {
    if (tables === undefined) {
        return
    }

    function listliClick(tableId) {
        if (activeTableId === tableId) {
            setActiveTableId("");
            return
        }

        setActiveTableId(tableId);
    }

    let newest;
    if (tables.length > 0) {
        newest = tables.reduce((a, b) => {Number(a.id) > Number(b.id) ? a : b});
    }

    let items = tables.filter(table => table.points.length > 1 || table.id === newest.id).map(table => {
        let showPoints = (activeTableId === table.id);
        let points;

        // Get list of points, if active for this table
        if (showPoints) {
            points = table.points.map((point, i) => {
                let label = (point.label !== undefined) ? <div>{point.label}</div> : null;
                return (
                    <li className={"pointitem listli"} key={i}>
                        <div>{label}</div>
                        <div>({point.x}, {point.y})</div>
                    </li>
                )
            })
        }

        // Return table
        return (
            <li className={"listli"} key={table.id} onClick={()=>{listliClick(table.id)}}>
                <div className={"tableitem"}>
                    <div className={"tablesize"}>{table.points.length}</div>
                    <div>{table.kind}</div>
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
