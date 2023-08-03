package sse

import "encoding/json"

type event struct {
	kind string
	data []byte
}

func (e event) Type() string {
	return e.kind
}

func (e event) Data() []byte {
	return e.data
}

func JSONEvent(kind string, data any) (Event, error) {
	b, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	return event{
		kind: kind,
		data: b,
	}, nil
}

func NewEvent(kind string, data []byte) Event {
	return event{
		kind: kind,
		data: data,
	}
}
