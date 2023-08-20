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
