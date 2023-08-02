package sse

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/lithammer/shortuuid/v4"
)

type Subscriber struct {
	id     string
	events chan Event
}

func (s Subscriber) Push(event Event) error {
	select {
	case s.events <- event:
		return nil
	default:
		return fmt.Errorf("unable to push event - subscriber %s lagging", s.id)
	}
}

func (s Subscriber) WriteEvents(w http.ResponseWriter) error {
	// Confirm connection is flushable
	f, ok := w.(http.Flusher)
	if !ok {
		return errors.New("streaming unsupported")
	}

	// Enable Streaming
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Transfer-Encoding", "chunked")

	// Stream events
	for event := range s.events {
		if t := event.Type(); t != "" {
			fmt.Fprintf(w, "event: %s\n", event.Type())
		}

		_, err := fmt.Fprintf(w, "data: %s\n\n", string(event.Data()))
		if err != nil {
			return err
		}

		f.Flush()
	}

	return nil
}

func (s Subscriber) Close() {
	close(s.events)
}

func NewSubscriber() Subscriber {
	return Subscriber{
		id:     shortuuid.New(),
		events: make(chan Event, 5),
	}
}
