package app

import (
	"mime"
	"net/http"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
)

var (
	_ = mime.AddExtensionType(".force", "force-init-mime")
)

type Router struct {
	mux *chi.Mux
	svc *Service
}

func (r Router) Mux() *chi.Mux {
	return r.mux
}

func NewRouter(svc *Service) *Router {
	r := chi.NewRouter()

	r.Use(
		middleware.Compress(5),
	)

	r.Route("/poly", func(r chi.Router) {
		r.Use(middleware.Logger, svc.auth)

		r.Get("/{polyId}", svc.getPoly)

		r.Post("/", svc.newPoly)

		r.Delete("/{polyId}", svc.deletePoly)
	})

	r.Route("/polys", func(r chi.Router) {
		r.Use(middleware.Logger, svc.auth)

		r.Get("/", svc.getPolys)
	})

	r.Route("/user", func(r chi.Router) {
		r.Use(middleware.Logger, svc.auth)

		r.Get("/{userId}", svc.getUser)
	})

	r.Route("/users", func(r chi.Router) {
		r.Use(middleware.Logger, svc.auth)

		r.Get("/", svc.getUsers)
	})

	r.Route("/point", func(r chi.Router) {
		r.Use(middleware.Logger, svc.auth)

		r.Delete("/{polyId}/{offset}", svc.deletePoint)
	})

	r.Route("/points", func(r chi.Router) {
		r.Use(middleware.Logger, svc.auth)

		r.Put("/{polyId}", svc.addPoints)
	})

	fs := http.FileServer(http.Dir("static"))
	r.Mount("/", fs)

	return &Router{mux: r, svc: svc}
}
