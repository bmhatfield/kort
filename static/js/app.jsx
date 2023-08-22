
const App = () => {
    const [polys, setPolys] = React.useState();
    const [activePolyId, setActivePolyId] = React.useState("");
    const [activePoint, setActivePoint] = React.useState();
    const [pingPoints, setPingPoints] = React.useState([]);
    const [otherPingPoints, setOtherPingPoints] = React.useState([]);
    const [bearer, setBearer] = React.useState(localStorage.getItem("token"));
    const [isLoading, setIsLoading] = React.useState(true);
    const [users, setUsers] = React.useState();
    const [userId, setUserId] = React.useState();
    const [pointStream, setPointStream] = React.useState();

    const headers = { "Content-Type": "application/json" }
    if (bearer) {
        headers["Authorization"] = `Bearer ${bearer}`;
    }

    React.useEffect(() => {
        if (bearer === undefined) return;
        const tokenStorage = localStorage.getItem("token");
        if (tokenStorage == null) return;

        let token;
        try {
            token = JSON.parse(atob(tokenStorage.trim()));
        } catch (err) {
            console.log("removing bad token");
            localStorage.removeItem("token");
            return;
        }


        setUserId(token.i);
    }, [bearer]);

    React.useEffect(() => {
        if (pointStream === undefined) {
            const stream = new EventSource("/events?stream=points");

            // Ping handler
            stream.addEventListener("ping", (e) => {
                const m = JSON.parse(e.data);

                // Add new point. Keep a max of 20 previous.
                setOtherPingPoints(prev => {
                    return [...prev.slice(-20), m];
                });

                // Clear the point after 90 seconds.
                setTimeout(() => {
                    setOtherPingPoints(prev => {
                        return [...prev.filter((pt) => {
                            return !(pt.point.x === m.point.x && pt.point.y === m.point.y);
                        })];
                    });
                }, 300000);
            });

            setPointStream(stream);
            return
        }
    }, [pointStream]);


    function handleLoginSubmit(e) {
        e.preventDefault();

        const data = new FormData(e.target);
        const token = data.get("token");

        if (token) {
            localStorage.setItem("token", token.trim());
            setBearer(token.trim());
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
        return fetch(`/points/${activePolyId}`, { body: JSON.stringify([point]), method: "PUT", headers: headers })
            .then(res => {
                if (!res.ok) {
                    throw new Error(res.statusText, res.body);
                }

                setPolys(prev => {
                    let active = prev.find(poly => poly.id === activePolyId)
                    active.points.push(point);
                    return [...prev];
                });
            });
    }

    function create(point, kind) {
        let update = {
            kind: kind,
            points: [point],
        };

        return fetch("/poly", { body: JSON.stringify(update), method: "POST", headers: headers }
        ).then(res => {
            if (!res.ok) {
                throw new Error(res.statusText, res.body);
            }

            return res.json();
        }).then(json => {
            update.id = json.id;
            update.userId = userId;
            setPolys([...polys, update]);
            setActivePolyId(json.id);
        });
    }

    function remove(p, i) {
        return fetch(`/point/${p}/${i}`, { method: "DELETE", headers: headers })
            .then(res => {
                if (!res.ok) {
                    throw new Error(res.statusText, res.body);
                }

                setPolys(prev => {
                    let active = prev.find(poly => poly.id === activePolyId)
                    active.points.splice(i, 1);
                    return [...prev];
                });
            });
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
        remove,
    }

    const sidebarProps = {
        create,
        append,
        polys,
        activePolyId,
        setActivePoint,
    }

    const pingProps = {
        setActivePoint,
        setPingPoints,
        pingPoints,
        headers,
    }

    return (
        <div>
            <Cartograph polys={polys} activePoint={activePoint} pingPoints={pingPoints} otherPingPoints={otherPingPoints} getUser={getUser} />
            <img id="logout" src="images/xmark.svg" onClick={(e) => { localStorage.removeItem("token"); setPolys(); setBearer(); }} />
            <Compass />
            <Ping {...pingProps} />
            <Sidebar {...sidebarProps}>
                <PolyList polys={polys} {...polyListProps} />
            </Sidebar>
            {isLoading && <div id="loading"><span className="loader"></span></div>}
        </div>
    )
}
