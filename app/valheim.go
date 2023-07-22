package app

const (
	Meadows     Biome = "meadows"
	BlackForest Biome = "forest"
	Swamp       Biome = "swamp"
	Mountain    Biome = "mountain"
	Ocean       Biome = "ocean"
	Plains      Biome = "plains"
	Mistlands   Biome = "mistlands"
	DeepNorth   Biome = "north"
	Ashlands    Biome = "ashlands"
)

var biomes = NewSet(
	Meadows,
	BlackForest,
	Swamp,
	Mountain,
	Ocean,
	Plains,
	Mistlands,
	DeepNorth,
	Ashlands,
)

type Biome string

func (b Biome) Valid() bool {
	return biomes.Contains(b)
}
