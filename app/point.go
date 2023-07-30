package app

type Points []Point

type Point struct {
	X int `json:"x,string"`
	Y int `json:"y,string"`

	Label string `json:"label,omitempty"`
	Biome Biome  `json:"biome,omitempty"`
}

func NewPoint(x, y int, label, biome string) Point {
	b := Biome(biome)
	if !b.Valid() {
		b = Biome("")
	}

	return Point{
		X:     x,
		Y:     y,
		Label: label,
		Biome: b,
	}
}
