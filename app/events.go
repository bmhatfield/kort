package app

const (
	EventAppend = "append"
	EventPing   = "ping"
)

type PingEvent struct {
	UserID string `json:"userId"`

	Point Point `json:"point"`
}

type AppendEvent struct {
	UserID string `json:"userId"`
	PolyID string `json:"polyId"`

	Point Point `json:"point"`
}
