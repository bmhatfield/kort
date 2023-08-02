package sse

import (
	"context"
	"log"
)

type Topic struct {
	subscribers map[string]Subscriber
}

func (t Topic) Broadcast(event Event) error {
	for id, sub := range t.subscribers {
		if err := sub.Push(event); err != nil {
			log.Printf("could not push event to subscriber %s: %s", id, err)
		}
	}

	return nil
}

func (t *Topic) Subscribe(sub Subscriber) {
	t.subscribers[sub.id] = sub
}

func (t *Topic) Unsubscribe(ctx context.Context, sub Subscriber) {
	<-ctx.Done()

	sub, ok := t.subscribers[sub.id]
	if ok {
		sub.Close()
		delete(t.subscribers, sub.id)
	}
}

func NewTopic() *Topic {
	return &Topic{
		subscribers: map[string]Subscriber{},
	}
}
