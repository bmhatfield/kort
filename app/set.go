package app

type Set[T comparable] map[T]struct{}

func (s Set[T]) Contains(ele T) bool {
	_, ok := s[ele]
	return ok
}

func NewSet[T comparable](ele ...T) Set[T] {
	s := make(Set[T])
	for _, e := range ele {
		s[e] = struct{}{}
	}
	return s
}
