# Migrate Tables

```js
fetch("http://localhost:3000/points/desmos-tables.json").then(res => res.json()).then(tables => tables.map((table, i) => {
    let points = table.map(pt => ({x: pt[0], y: pt[1]}));

    if ([3].includes(i)) return;

    const update = {
        kind: ([5, 8, 11].includes(i) ) ? "outline" : "track",
        points: points,
    };

    fetch("http://localhost:3000/table", { body: JSON.stringify(update), method: "POST" });
}));
```

# Migrate Points

```js
fetch("http://localhost:3000/points/desmos-points.json").then(res => res.json()).then(pts => pts.map(pt => {
    let [x,y] = pt.pos.split(",");
    const point = {
        x: x,
        y: y,
        label: pt.name,
    };

    const update = {
        points: [point],
    };

    fetch("http://localhost:3000/table", { body: JSON.stringify(update), method: "POST" });
}));
```

# Export Points

```js
fetch("http://localhost:3000/tables").then(res => {
    return res.json();
}).then(json => {
    console.log(json);
});
```

# Restore Points
```js
fetch("http://localhost:3000/points/export.json").then(res => res.json()).then(tables => tables.map((table, i) => {
   fetch("http://localhost:3000/table", { body: JSON.stringify(table), method: "POST" });
}));
```
