package app

import (
	"compress/gzip"
	"encoding/json"
	"net/http"
)

func GzipJSON(w http.ResponseWriter, body any) error {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Encoding", "gzip")

	gw := gzip.NewWriter(w)
	defer gw.Close()
	return json.NewEncoder(gw).Encode(body)
}
