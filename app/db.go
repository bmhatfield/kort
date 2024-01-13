package app

import (
	"errors"
	"log"

	bolt "go.etcd.io/bbolt"
)

var (
	ErrNotFound = errors.New("not found")
	ErrNoBucket = errors.New("no bucket")
)

func Key(k string) []byte {
	return []byte(k)
}

type Store struct {
	db *bolt.DB
}

func (s *Store) Cleanup() {
	s.db.Close()
}

func (s *Store) Users() *Object[*User] {
	return &Object[*User]{
		db:     s.db,
		bucket: "users",
	}
}

func (s *Store) Polys() *Object[*Poly] {
	return &Object[*Poly]{
		db:     s.db,
		bucket: "polys",
	}
}

func NewStore(path string, buckets ...string) *Store {
	db, err := bolt.Open(path, 0o600, nil)
	if err != nil {
		log.Fatal(err)
	}

	if err := db.Update(func(tx *bolt.Tx) error {
		for i, name := range buckets {
			b, err := tx.CreateBucketIfNotExists(Key(name))
			if err != nil {
				return err
			}
			log.Printf("(%d/%d) %s: %d key-value pairs", i+1, len(buckets), name, b.Stats().KeyN)
		}
		return nil
	}); err != nil {
		log.Fatalf("unable to set up points DB: %v", err)
	}

	return &Store{db: db}
}
