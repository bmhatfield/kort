package app

import "encoding/json"

const (
	AppendEvent PointEventKind = "ap"
	PingEvent   PointEventKind = "pg"
)

type PointEventKind string

type PointEvent struct {
	UserID string `json:"userId"`
	PolyID string `json:"polyId,omitempty"`

	Kind  PointEventKind `json:"kind"`
	Point Point          `json:"point"`
}

func (pe PointEvent) Bytes() []byte {
	b, err := json.Marshal(pe)
	if err != nil {
		return nil
	}

	return b
}
