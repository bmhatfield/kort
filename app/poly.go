package app

import (
	"time"

	"golang.org/x/exp/slices"
)

type Poly struct {
	PolyID  string    `json:"id"`
	Kind    PolyKind  `json:"kind,omitempty"`
	Created time.Time `json:"created"`
	UserID  string    `json:"userId"`

	Points []Point `json:"points"`
}

func (p *Poly) ID() string {
	return p.PolyID
}

func (p *Poly) SetID(id string) {
	p.PolyID = id
}

func (p *Poly) Add(points ...Point) {
	p.Points = append(p.Points, points...)
}

func (p *Poly) Delete(offsets ...int) {
	for _, o := range offsets {
		p.Points = slices.Delete(p.Points, o, o+1)
	}
}

func NewPoly(from PolyUpdate, userID string) *Poly {
	return &Poly{
		Points:  from.Points,
		Kind:    from.Kind,
		Created: time.Now(),
		UserID:  userID,
	}
}

type PolyUpdate struct {
	PolyID string   `json:"id,omitempty"`
	Kind   PolyKind `json:"kind,omitempty"`

	Points []Point `json:"points"`
}

const (
	Outline PolyKind = "outline"
	Track   PolyKind = "track"
	Marker  PolyKind = "marker"
)

var polyKinds = NewSet(
	Outline,
	Track,
	Marker,
)

type PolyKind string

func (p PolyKind) Valid() bool {
	return polyKinds.Contains(p)
}
