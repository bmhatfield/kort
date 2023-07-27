package app

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type ContextKey string

const (
	UserContextKey ContextKey = "user"
)

type Middleware func(http.HandlerFunc) http.HandlerFunc

type Server struct {
	store *Store

	middleware []Middleware
}

func (s *Server) auth(next http.HandlerFunc) http.HandlerFunc {
	logReq := func(start time.Time, u *User, r *http.Request, status int) {
		base := fmt.Sprintf("%s %s %d (%s)", r.RequestURI, r.Method, status, time.Since(start))
		if u == nil {
			log.Print(base)
			return
		}

		log.Printf("%s - %s (id:%s)", base, u.Name, u.UserID)
	}

	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h := r.Header.Get("Authorization")
		if h == "" {
			logReq(start, nil, r, http.StatusUnauthorized)
			http.Error(w, "missing authorization header", http.StatusUnauthorized)
			return
		}

		b, err := DecodeBearer(h)
		if err != nil {
			logReq(start, nil, r, http.StatusUnauthorized)
			http.Error(w, "bearer token invalid format", http.StatusUnauthorized)
			return
		}

		u, err := s.store.Users().Get(b.UserID)
		if err != nil {
			logReq(start, nil, r, http.StatusUnauthorized)
			http.Error(w, "no such user", http.StatusUnauthorized)
			return
		}

		if err := u.VerifyToken(b.Token); err != nil {
			logReq(start, u, r, http.StatusUnauthorized)
			http.Error(w, "token invalid", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, u)
		next(w, r.WithContext(ctx))
		logReq(start, u, r, http.StatusOK)
	}
}

func (s *Server) chain(next http.HandlerFunc) http.HandlerFunc {
	c := next
	for _, m := range s.middleware {
		c = m(c)
	}

	return s.auth(c)
}

func (s *Server) encode(w http.ResponseWriter, v any, err error) {
	if err != nil {
		s.error(w, err)
		return
	}

	s.error(w, json.NewEncoder(w).Encode(v))
}

func (s *Server) decode(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func (s *Server) error(w http.ResponseWriter, err error) {
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) Serve(mux *http.ServeMux) {
	for route, handler := range map[string]http.HandlerFunc{
		"/user":  s.User,
		"/users": s.Users,
		"/poly":  s.Poly,
		"/polys": s.Polys,
		"/point": s.Point,
	} {
		mux.HandleFunc(route, s.chain(handler))
	}
}

func (s *Server) User(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		id := r.FormValue("userId")
		u, err := s.store.Users().Get(id)
		s.encode(w, u, err)
	case http.MethodPost:
		http.Error(w, "unimplemented", http.StatusNotImplemented)
	case http.MethodPatch:
		http.Error(w, "unimplemented", http.StatusNotImplemented)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) Users(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		u, err := s.store.Users().List()
		s.encode(w, u, err)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) Poly(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(UserContextKey).(*User)

	switch r.Method {
	case http.MethodGet:
		id := r.FormValue("polyId")
		t, err := s.store.Polys().Get(id)
		s.encode(w, t, err)
	case http.MethodPost:
		var up PolyUpdate
		err := s.decode(r, &up)
		if err != nil {
			s.error(w, err)
			return
		}

		t := NewPoly(up, user.UserID)
		id, err := s.store.Polys().New(t)
		s.encode(w, Identifier{ID: id}, err)
	case http.MethodPatch:
		var up PolyUpdate
		err := s.decode(r, &up)
		if err != nil {
			s.error(w, err)
			return
		}

		p, err := s.store.Polys().Get(up.PolyID)
		if err != nil {
			s.error(w, err)
			return
		}

		if !user.Can(Update, p.UserID) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		p.Add(up.Points...)
		if err := s.store.Polys().Replace(p); err != nil {
			s.error(w, err)
			return
		}
	case http.MethodDelete:
		id := r.FormValue("polyId")
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
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) Polys(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		t, err := s.store.Polys().List()
		s.encode(w, t, err)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) Point(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(UserContextKey).(*User)

	switch r.Method {
	case http.MethodDelete:
		var de PointDelete
		err := s.decode(r, &de)
		if err != nil {
			s.error(w, err)
			return
		}

		p, err := s.store.Polys().Get(de.PolyID)
		if err != nil {
			s.error(w, err)
			return
		}

		if !user.Can(Update, p.UserID) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		p.Delete(de.PointOffset)
		if err := s.store.Polys().Replace(p); err != nil {
			s.error(w, err)
			return
		}
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func NewServer(store *Store, middleware ...Middleware) *Server {
	return &Server{
		store:      store,
		middleware: middleware,
	}
}
