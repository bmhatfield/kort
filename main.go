package main

import (
	"log"
	"net/http"
	"time"

	"github.com/bmhatfield/kort/app"
)

var fs = http.FileServer(http.Dir("static"))

func Logger(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next(w, r)
		log.Printf("%s %s (%s)", r.RequestURI, r.Method, time.Since(start))
	}
}

func main() {
	store := app.NewStore("points.db", "users", "tables")
	defer store.Cleanup()

	server := app.NewServer(store, Logger)

	mux := http.NewServeMux()
	mux.Handle("/", Logger(fs.ServeHTTP))
	server.Serve(mux)

	log.Print("Listening on 127.0.0.1:3000...")
	if err := http.ListenAndServe("127.0.0.1:3000", mux); err != nil {
		log.Fatal(err)
	}
}
