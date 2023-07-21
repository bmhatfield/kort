big package main

import (
	"log"
	"net/http"
	"time"
)

func WithLogging(h http.Handler) http.Handler {
	logFn := func(rw http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h.ServeHTTP(rw, r) // serve the original request
		log.Printf("%s %s (%s)", r.RequestURI, r.Method, time.Since(start))
	}
	return http.HandlerFunc(logFn)
}

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", WithLogging(fs))

	log.Print("Listening on 127.0.0.1:3000...")
	err := http.ListenAndServe("127.0.0.1:3000", nil)
	if err != nil {
		log.Fatal(err)
	}
}
