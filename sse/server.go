package sse

import (
	"fmt"
	"net/http"
)

type Event interface {
	Type() string
	Data() []byte
}

type EventServer struct {
	events chan Event

	topics *Topics
}

func (e *EventServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	topic := e.topics.Create(r.URL.Query().Get("stream"))

	s := NewSubscriber()
	topic.Subscribe(s)
	go topic.Unsubscribe(r.Context(), s)

	if err := s.WriteEvents(w); err != nil {
		http.Error(w, fmt.Sprintf("unable to write events: %s", err), http.StatusInternalServerError)
		return
	}
}

func (e *EventServer) Broadcast(name string, event Event) error {
	topic, err := e.topics.get(name)
	if err != nil {
		return err
	}
	return topic.Broadcast(event)
}

func (e *EventServer) Create(name string) {
	e.topics.Create(name)
}

func NewEventServer() *EventServer {
	return &EventServer{
		events: make(chan Event, 100),
		topics: NewTopics(),
	}
}
