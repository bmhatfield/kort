package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/bmhatfield/kort/app"
	"github.com/urfave/cli/v2"
)

var fs = http.FileServer(http.Dir("static"))

func Logger(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next(w, r)
		if r.URL.Path != "/" {
			log.Printf("%s %s (%s)", r.RequestURI, r.Method, time.Since(start))
		}
	}
}

func main() {
	app := &cli.App{
		Name:        "kort",
		Description: "kort is the poly server for the kort app",
		Flags: []cli.Flag{
			&cli.StringFlag{Name: "listen", Value: "127.0.0.1:3000", Usage: "address to listen on"},
			&cli.StringFlag{Name: "db", Value: "points.db", Usage: "database file"},
		},
		Commands: []*cli.Command{
			app.AddUser(),
		},
		Action: func(c *cli.Context) error {
			store := app.NewStore(c.String("db"), "users", "polys")
			defer store.Cleanup()

			server := app.NewServer(store)

			mux := http.NewServeMux()
			mux.Handle("/", Logger(fs.ServeHTTP))
			server.Serve(mux)

			log.Printf("Listening on %s...", c.String("listen"))
			return http.ListenAndServe(c.String("listen"), mux)
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}
