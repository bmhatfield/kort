package app

import (
	"errors"
	"fmt"
	"time"

	argon2id "github.com/bmhatfield/kort/argon2"
	"github.com/urfave/cli/v2"
)

var ErrInvalidToken = errors.New("invalid token")

type User struct {
	UserID    string `json:"id"`
	TokenHash string `json:"token"`

	Name   string        `json:"name"`
	Rights []AccessRight `json:"rights"`

	Created time.Time `json:"created"`
}

func (u *User) ID() string {
	return u.UserID
}

func (u *User) SetID(id string) {
	u.UserID = id
}

func (u *User) SetToken(token string) error {
	h, err := argon2id.CreateHash(token, argon2id.DefaultParams)
	if err != nil {
		return err
	}

	u.TokenHash = h
	return nil
}

func (u *User) VerifyToken(token string) error {
	m, err := argon2id.ComparePasswordAndHash(token, u.TokenHash)
	if err != nil {
		return err
	}

	if !m {
		return ErrInvalidToken
	}

	return nil
}

func (u *User) Can(right AccessRight, p *Poly) bool {
	if p.UserID == u.UserID {
		return true
	}

	for _, r := range u.Rights {
		if r == right {
			return true
		}
	}

	return false
}

func AddUser() *cli.Command {
	return &cli.Command{
		Name:        "add-user",
		Description: "add a user",
		Flags: []cli.Flag{
			&cli.StringFlag{Name: "name", Usage: "user name", Required: true},
			&cli.StringFlag{Name: "token", Usage: "user token", Required: true},
			&cli.BoolFlag{Name: "create", Aliases: []string{"c"}, Value: true, Usage: "user can create any poly"},
			&cli.BoolFlag{Name: "read", Aliases: []string{"r"}, Value: true, Usage: "user can read any poly"},
			&cli.BoolFlag{Name: "update", Aliases: []string{"u"}, Usage: "user can update any poly (users can always self-update)"},
			&cli.BoolFlag{Name: "delete", Aliases: []string{"d"}, Usage: "user can delete any poly (users can always self-delete)"},
		},
		Action: func(c *cli.Context) error {
			store := NewStore(c.String("db"), "users", "polys")
			defer store.Cleanup()

			u := &User{
				Name:    c.String("name"),
				Created: time.Now(),
				Rights:  []AccessRight{},
			}
			if err := u.SetToken(c.String("token")); err != nil {
				return err
			}

			if c.Bool("create") {
				u.Rights = append(u.Rights, Create)
			}

			if c.Bool("read") {
				u.Rights = append(u.Rights, Read)
			}

			if c.Bool("update") {
				u.Rights = append(u.Rights, Update)
			}

			if c.Bool("delete") {
				u.Rights = append(u.Rights, Delete)
			}

			id, err := store.Users().New(u)
			if err != nil {
				return err
			}

			b := NewBearer(id, c.String("token"))

			fmt.Printf("User %s created with ID %s - bearer: %q\n", u.Name, id, b)
			return nil
		},
	}
}
