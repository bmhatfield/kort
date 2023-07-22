package app

import "time"

type Table struct {
	TableID string    `json:"id"`
	Created time.Time `json:"created"`
	UserID  string    `json:"userId"`

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

type TableUpdate struct {
	TableID string  `json:"id"`
	Points  []Point `json:"points"`
}

func NewTable(from TableUpdate) *Table {
	return &Table{
		Points:  from.Points,
		Created: time.Now(),
		UserID:  "system",
	}
}
