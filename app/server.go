package app

import (
	"encoding/json"
	"net/http"
)

type Middleware func(http.HandlerFunc) http.HandlerFunc

type Server struct {
	store *Store

	middleware []Middleware
}

func (s *Server) chain(next http.HandlerFunc) http.HandlerFunc {
	if len(s.middleware) == 0 {
		return next
	}

	c := next
	for _, m := range s.middleware {
		c = m(c)
	}
	return c
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
		"/user":   s.User,
		"/users":  s.Users,
		"/table":  s.Table,
		"/tables": s.Tables,
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
	case http.MethodPatch:
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

func (s *Server) Table(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		id := r.FormValue("tableId")
		t, err := s.store.Tables().Get(id)
		s.encode(w, t, err)
	case http.MethodPost:
		var t Table
		err := s.decode(r, &t)
		if err != nil {
			s.error(w, err)
			return
		}

		id, err := s.store.Tables().New(&t)
		s.encode(w, Identifier{ID: id}, err)
	case http.MethodPatch:
		var up TableUpdate
		err := s.decode(r, &up)
		if err != nil {
			s.error(w, err)
			return
		}

		t, err := s.store.Tables().Get(up.TableID)
		if err != nil {
			s.error(w, err)
			return
		}

		t.Add(up.Points...)
		if err := s.store.Tables().Replace(t); err != nil {
			s.error(w, err)
			return
		}
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) Tables(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		t, err := s.store.Tables().List()
		s.encode(w, t, err)
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
