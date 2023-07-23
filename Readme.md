# Migrate Tables

```js
fetch("http://localhost:3000/tables.json").then(res => res.json()).then(tables => tables.map(table => {
    let points = table.map(pt => ({x: pt[0], y: pt[1]}));

    const update = {
        points: points,
    };

    fetch("http://localhost:3000/table", { body: JSON.stringify(update), method: "POST" });
}));
```

# Migrate Points

```js
fetch("http://localhost:3000/points.json").then(res => res.json()).then(pts => pts.map(pt => {
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
