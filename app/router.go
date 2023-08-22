package app

import (
	"mime"
	"net/http"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
)

var _ = mime.AddExtensionType(".force", "force-init-mime")

type Router struct {
	mux *chi.Mux
	svc *Service
}

func (r Router) Mux() *chi.Mux {
	return r.mux
}

func NewRouter(svc *Service) *Router {
	r := chi.NewRouter()

	// Compress all routes
	r.Use(
		middleware.Compress(5),
	)

	// Authenticated / logged routes
	r.Group(func(r chi.Router) {
		r.Use(
			middleware.Logger,
			svc.auth,
		)

		r.Route("/poly", func(r chi.Router) {
			r.Get("/{polyId}", svc.getPoly)
			r.Post("/", svc.newPoly)
			r.Delete("/{polyId}", svc.deletePoly)
		})

		r.Route("/user", func(r chi.Router) {
			r.Get("/{userId}", svc.getUser)
		})

		r.Route("/users", func(r chi.Router) {
			r.Get("/", svc.getUsers)
		})

		r.Route("/point", func(r chi.Router) {
			r.Delete("/{polyId}/{offset}", svc.deletePoint)
		})

		r.Route("/points", func(r chi.Router) {
			r.Put("/{polyId}", svc.addPoints)
		})

		r.Route("/ping", func(r chi.Router) {
			r.Put("/", svc.pingPoint)
		})
	})

	// Unauthenticated routes
	r.Group(func(r chi.Router) {
		r.Use(
			middleware.Logger,
		)

		r.Route("/polys", func(r chi.Router) {
			r.Get("/", svc.getPolys)
		})
	})

	// Event stream. Auth not yet supported
	r.Mount("/events", svc.events)

	// File server
	r.Mount("/", http.FileServer(http.Dir("static")))

	return &Router{mux: r, svc: svc}
}
