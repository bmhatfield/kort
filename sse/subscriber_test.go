package sse

import (
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSubscriber_Push(t *testing.T) {
	sub := NewSubscriber()
	assert.Len(t, sub.events, 0)

	sub.Push(NewEvent("foo", []byte("bar")))
	assert.Len(t, sub.events, 1)
}

func TestSubscriber_WriteEvents(t *testing.T) {
	sub := NewSubscriber()
	assert.Len(t, sub.events, 0)

	sub.Push(NewEvent("foo", []byte("bar")))
	assert.Len(t, sub.events, 1)
	sub.Close()

	w := httptest.NewRecorder()
	assert.NoError(t, sub.WriteEvents(w))
	assert.Len(t, sub.events, 0)

	assert.Equal(t, "event: foo\ndata: bar\n\n", w.Body.String())
	assert.Equal(t, "text/event-stream", w.Header().Get("Content-Type"))
	assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
	assert.Equal(t, "keep-alive", w.Header().Get("Connection"))
	assert.Equal(t, "chunked", w.Header().Get("Transfer-Encoding"))
	assert.Equal(t, 200, w.Code)
}
