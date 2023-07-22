package app

import "time"

type User struct {
	UserID string `json:"id"`

	Name string `json:"name"`

	Created time.Time `json:"created"`
}

func (u *User) ID() string {
	return u.UserID
}

func (u *User) SetID(id string) {
	u.UserID = id
}
