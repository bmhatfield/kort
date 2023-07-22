package main

import (
	"log"
	"net/http"
	"time"
)

var (
	fs = http.FileServer(http.Dir("static"))
)

func WithLogging(h http.Handler) http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h.ServeHTTP(rw, r) // serve the original request
		log.Printf("%s %s (%s)", r.RequestURI, r.Method, time.Since(start))
	})
}

func savePoint() http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		x := r.FormValue("x")
		y := r.FormValue("y")
		label := r.FormValue("label")
		biome := r.FormValue("biome")
		mode := r.FormValue("mode")

		if x == "" || y == "" {
			http.Error(rw, "missing coordinates", http.StatusBadRequest)
		}

		log.Printf("(%s, %s) %s %s %s", x, y, label, biome, mode)
	})
}

func main() {
	http.Handle("/", WithLogging(fs))
	http.Handle("/savepoint", WithLogging(savePoint()))

	log.Print("Listening on 127.0.0.1:3000...")
	err := http.ListenAndServe("127.0.0.1:3000", nil)
	if err != nil {
		log.Fatal(err)
	}
}
