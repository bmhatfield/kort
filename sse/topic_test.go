package sse

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTopic_Subscribe(t *testing.T) {
	topic := NewTopic(10)
	assert.Len(t, topic.subscribers, 0)

	topic.Subscribe(NewSubscriber())
	assert.Len(t, topic.subscribers, 1)
}

func TestTopic_Unsubscribe(t *testing.T) {
	topic := NewTopic(10)
	sub := NewSubscriber()
	topic.Subscribe(sub)
	assert.Len(t, topic.subscribers, 1)

	ctx, cancel := context.WithCancel(context.TODO())

	go topic.Unsubscribe(ctx, sub)
	assert.Len(t, topic.subscribers, 1)
	time.Sleep(1 * time.Millisecond) // let nothing occur

	cancel()
	time.Sleep(1 * time.Millisecond) // let cleanup occur
	assert.Len(t, topic.subscribers, 0)
}

func TestTopic_Broadcast(t *testing.T) {
	topic := NewTopic(10)
	sub := NewSubscriber()
	topic.Subscribe(sub)

	assert.Len(t, sub.events, 0)
	assert.Len(t, topic.events, 0)

	require.NoError(t, topic.Broadcast(NewEvent("foo", []byte("bar"))))
	time.Sleep(1 * time.Millisecond) // let broadcast occur
	assert.Len(t, sub.events, 1)
	assert.Len(t, topic.events, 0)
}
