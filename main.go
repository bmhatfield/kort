package main

import (
	"log"
	"net/http"
	"os"

	"github.com/bmhatfield/kort/app"
	"github.com/urfave/cli/v2"
)

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
			app.EditPermissions(),
		},
		Action: func(c *cli.Context) error {
			store := app.NewStore(c.String("db"), "users", "polys")
			defer store.Cleanup()

			router := app.NewRouter(app.NewService(store))

			log.Printf("Listening on %s...", c.String("listen"))
			return http.ListenAndServe(c.String("listen"), router.Mux())
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}
