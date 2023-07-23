package app

import "time"

type Table struct {
	TableID string    `json:"id"`
	Created time.Time `json:"created"`
	UserID  string    `json:"userId"`
	Kind    TableKind `json:"kind,omitempty"`

	Points []Point `json:"points"`
}

func (t *Table) ID() string {
	return t.TableID
}

func (t *Table) SetID(id string) {
	t.TableID = id
}

func (t *Table) Add(points ...Point) {
	t.Points = append(t.Points, points...)
}

func NewTable(from TableUpdate) *Table {
	return &Table{
		Points:  from.Points,
		Kind:    from.Kind,
		Created: time.Now(),
		UserID:  "system",
	}
}

type TableUpdate struct {
	TableID string    `json:"id,omitempty"`
	Kind    TableKind `json:"kind,omitempty"`
	Points  []Point   `json:"points"`
}

const (
	Outline TableKind = "outline"
	Track   TableKind = "track"
)

var tableKinds = NewSet(
	Outline,
	Track,
)

type TableKind string

func (tk TableKind) Valid() bool {
	return tableKinds.Contains(tk)
}
