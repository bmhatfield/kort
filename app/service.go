package app

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/bmhatfield/sse"
	"github.com/go-chi/chi/v5"
)

type ContextKey string

const (
	UserContextKey ContextKey = "user"
	PointStream    string     = "points"
)

type Service struct {
	store  *Store
	events *sse.EventServer
}

func (s *Service) auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if h == "" {
			http.Error(w, "missing authorization header", http.StatusUnauthorized)
			return
		}

		b, err := DecodeBearer(h)
		if err != nil {
			http.Error(w, "bearer token invalid format", http.StatusUnauthorized)
			return
		}

		u, err := s.store.Users().Get(b.UserID)
		if err != nil {
			http.Error(w, "no such user", http.StatusUnauthorized)
			return
		}

		if err := u.VerifyToken(b.Token); err != nil {
			http.Error(w, "token invalid", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, u)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *Service) encode(w http.ResponseWriter, v any, err error) {
	if err != nil {
		s.error(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	s.error(w, json.NewEncoder(w).Encode(v))
}

func (s *Service) decode(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func (s *Service) error(w http.ResponseWriter, err error) {
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Service) getUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userId")
	u, err := s.store.Users().Get(id)
	s.encode(w, u, err)
}

func (s *Service) getUsers(w http.ResponseWriter, r *http.Request) {
	u, err := s.store.Users().List()
	s.encode(w, u, err)
}

func (s *Service) getPoly(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "polyId")
	t, err := s.store.Polys().Get(id)
	s.encode(w, t, err)
}

func (s *Service) newPoly(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var up NewPolyData
	err := s.decode(r, &up)
	if err != nil {
		s.error(w, err)
		return
	}

	uid := user.UserID
	if up.UserID != "" && user.Can(Create, up.UserID) {
		uid = up.UserID
	}

	t := NewPoly(up, uid)
	id, err := s.store.Polys().New(t)
	s.encode(w, Identifier{ID: id}, err)
}

func (s *Service) deletePoly(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := chi.URLParam(r, "polyId")
	p, err := s.store.Polys().Get(id)
	if err != nil {
		s.error(w, err)
		return
	}

	if !user.Can(Delete, p.UserID) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := s.store.Polys().Delete(p.PolyID); err != nil {
		s.error(w, err)
		return
	}
}

func (s *Service) getPolys(w http.ResponseWriter, r *http.Request) {
	t, err := s.store.Polys().List()
	s.encode(w, t, err)
}

func (s *Service) deletePoint(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := chi.URLParam(r, "polyId")
	offset, err := strconv.Atoi(chi.URLParam(r, "offset"))
	if err != nil {
		s.error(w, err)
		return
	}

	p, err := s.store.Polys().Get(id)
	if err != nil {
		s.error(w, err)
		return
	}

	if !user.Can(Update, p.UserID) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	p.Delete(offset)
	if err := s.store.Polys().Replace(p); err != nil {
		s.error(w, err)
		return
	}
}

func (s *Service) addPoints(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := chi.URLParam(r, "polyId")

	var pts Points
	err := s.decode(r, &pts)
	if err != nil {
		s.error(w, err)
		return
	}

	p, err := s.store.Polys().Get(id)
	if err != nil {
		s.error(w, err)
		return
	}

	if !user.Can(Update, p.UserID) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	p.Add(pts...)
	if err := s.store.Polys().Replace(p); err != nil {
		s.error(w, err)
		return
	}
}

func (s *Service) pingPoint(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var pts Points
	err := s.decode(r, &pts)
	if err != nil {
		s.error(w, err)
		return
	}

	for _, pt := range pts {
		event, err := sse.JSONEvent(EventPing, PingEvent{
			UserID: user.UserID,
			Point:  pt,
		})
		if err != nil {
			log.Printf("failed to create JSONEvent for Ping: %s", err)
		}

		if err := s.events.Broadcast(PointStream, event); err != nil {
			log.Printf("failed to broadcast: %s", err)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Service) logEventStats(d time.Duration) {
	ticker := time.NewTicker(d)
	for range ticker.C {
		log.Printf("%+v", s.events.Stats())
	}
}

func NewService(store *Store) *Service {
	events := sse.NewEventServer()
	events.Create(PointStream)

	svc := &Service{
		store:  store,
		events: events,
	}
	go svc.logEventStats(10 * time.Minute)

	return svc
}
