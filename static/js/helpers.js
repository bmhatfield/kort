const biomeColors = {
    "meadows": "yellowgreen",
    "forest": "forestgreen",
    "swamp": "peru",
    "mountain": "silver",
    "ocean": "steelblue",
    "plains": "khaki",
    "mistlands": "orchid",
    "north": "lightsteelblue",
    "ashlands": "crimson",
    undefined: "slategray",
};

function biomeColor(name) {
    return biomeColors[name];
};

function distance(p1, p2) {
    const xD = Math.abs(p1.x - p2.x);
    const yD = Math.abs(p1.y - p2.y);
    return Math.sqrt(xD * xD + yD * yD);
}
