package sse

import (
	"context"
	"fmt"
	"log"
	"sync"
)

type Topic struct {
	events chan Event

	subscribers map[string]Subscriber

	mu sync.RWMutex
}

func (t *Topic) fanout() {
	for event := range t.events {
		t.mu.RLock()
		for _, sub := range t.subscribers {
			if err := sub.Push(event); err != nil {
				log.Printf("could not push event: %s", err)
			}
		}
		t.mu.RUnlock()
	}
}

func (t *Topic) Broadcast(event Event) error {
	select {
	case t.events <- event:
		return nil
	default:
		return fmt.Errorf("could not broadcast event, topic full")
	}
}

func (t *Topic) Subscribe(sub Subscriber) {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.subscribers[sub.id] = sub
}

func (t *Topic) Unsubscribe(ctx context.Context, sub Subscriber) {
	<-ctx.Done()

	t.mu.Lock()
	defer t.mu.Unlock()

	sub, ok := t.subscribers[sub.id]
	if ok {
		sub.Close()
		delete(t.subscribers, sub.id)
	}
}

func NewTopic(backlog int) *Topic {
	t := &Topic{
		events:      make(chan Event, backlog),
		subscribers: map[string]Subscriber{},
		mu:          sync.RWMutex{},
	}

	go t.fanout()
	return t
}
