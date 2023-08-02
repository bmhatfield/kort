package sse

import "fmt"

type Topics struct {
	topics map[string]*Topic
}

func (t *Topics) get(name string) (*Topic, error) {
	tp, ok := t.topics[name]
	if !ok {
		return nil, fmt.Errorf("topic does not exist: %s", name)
	}

	return tp, nil
}

func (t *Topics) Create(name string) *Topic {
	topic, ok := t.topics[name]
	if ok {
		return topic
	}

	topic = NewTopic()
	t.topics[name] = topic
	return topic
}

func NewTopics() *Topics {
	return &Topics{
		topics: map[string]*Topic{},
	}
}
