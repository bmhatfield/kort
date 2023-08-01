# Point Exports

## Backing up Kort

### Export Points

```js
let headers = {headers: {"Authorization": "Bearer " + localStorage.getItem("token")}};
fetch("/polys", headers).then(res => {
    return res.json();
}).then(json => {
    console.log(json);
});
```

### Restore Points
```js
let headers = {"Authorization": "Bearer " + localStorage.getItem("token")};
fetch("/backup/export.json").then(res => res.json()).then(async (polys) => {
    for (let poly of polys) {
       await fetch("/poly", { body: JSON.stringify(poly), method: "POST", headers: headers });
    }
});
```

## Working with Desmos objects

### Migrate Tables

```js
let headers = {"Authorization": "Bearer " + localStorage.getItem("token")};
fetch("/backup/desmos-tables.json").then(res => res.json()).then(polys => polys.map((poly, i) => {
    let points = poly.map(pt => ({x: pt[0], y: pt[1]}));

    if ([3].includes(i)) return;

    const update = {
        kind: ([5, 8, 11].includes(i) ) ? "outline" : "track",
        points: points,
    };

    fetch("/poly", { headers: headers, body: JSON.stringify(update), method: "POST" });
}));
```

### Migrate Points

```js
let headers = {"Authorization": "Bearer " + localStorage.getItem("token")};
fetch("/backup/desmos-points.json").then(res => res.json()).then(pts => pts.map(pt => {
    let [x,y] = pt.pos.split(",");
    const point = {
        x: x,
        y: y,
        label: pt.name,
    };

    const update = {
        points: [point],
    };

    fetch("/poly", { headers: headers, body: JSON.stringify(update), method: "POST" });
}));
```
