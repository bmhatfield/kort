package main

import (
        "flag"
	"log"
        "net"
	"net/http"
        "strconv"
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
	store := app.NewStore("points.db", "users", "polys")
	defer store.Cleanup()

	server := app.NewServer(store, Logger)

	mux := http.NewServeMux()
	mux.Handle("/", Logger(fs.ServeHTTP))
	server.Serve(mux)

	listenAddr := flag.String("listen_address", "127.0.0.1", "address to listen on")
        port := flag.Int("listen_port", 3000, "port to listen on")
        flag.Parse()
        listenString := net.JoinHostPort(*listenAddr, strconv.Itoa(*port))

	log.Printf("Listening on %s...", listenString)
	if err := http.ListenAndServe(listenString, mux); err != nil {
		log.Fatal(err)
	}
}
