package app

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
)

var ErrInvalidBearer = errors.New("invalid bearer")

type Bearer struct {
	UserID string `json:"i"`
	Token  string `json:"t"`
}

func DecodeBearer(bearer string) (*Bearer, error) {
	p := strings.Split(bearer, " ")
	if len(p) != 2 {
		return nil, ErrInvalidBearer
	}

	b, err := base64.StdEncoding.DecodeString(p[1])
	if err != nil {
		return nil, err
	}

	var out Bearer
	if err := json.Unmarshal(b, &out); err != nil {
		return nil, err
	}

	return &out, nil
}

func NewBearer(id, token string) string {
	b, _ := json.Marshal(Bearer{
		UserID: id,
		Token:  token,
	})

	return "Bearer " + base64.StdEncoding.EncodeToString(b)
}
