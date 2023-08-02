package sse

import "encoding/json"

type jsonEvent struct {
	kind string
	data []byte
}

func (j jsonEvent) Type() string {
	return j.kind
}

func (j jsonEvent) Data() []byte {
	return j.data
}

func NewJSON(kind string, data any) (Event, error) {
	b, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	return jsonEvent{
		kind: kind,
		data: b,
	}, nil
}
