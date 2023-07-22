package app

import (
	"encoding/json"
	"strconv"

	bolt "go.etcd.io/bbolt"
)

type Identifer[T any] interface {
	ID() string
	SetID(string)
	*T
}

type Object[T any, P Identifer[T]] struct {
	db     *bolt.DB
	bucket string
}

func (o *Object[T, P]) New(obj P) (string, error) {
	id := ""
	if err := o.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		seq, err := bucket.NextSequence()
		if err != nil {
			return err
		}

		obj.SetID(strconv.Itoa(int(seq)))
		id = obj.ID()

		b, err := json.Marshal(obj)
		if err != nil {
			return err
		}

		return bucket.Put(Key(obj.ID()), b)
	}); err != nil {
		return id, err
	}

	return id, nil
}

func (o *Object[T, P]) Replace(obj P) error {
	return o.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		b, err := json.Marshal(obj)
		if err != nil {
			return err
		}

		return bucket.Put(Key(obj.ID()), b)
	})
}

func (o *Object[T, P]) Get(id string) (P, error) {
	var obj T
	if err := o.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		b := bucket.Get(Key(id))
		if b == nil {
			return ErrNotFound
		}

		return json.Unmarshal(b, &obj)
	}); err != nil {
		return nil, err
	}

	return &obj, nil
}

func (o *Object[T, P]) List() ([]P, error) {
	out := make([]P, 0)
	if err := o.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		return bucket.ForEach(func(k, v []byte) error {
			var obj T
			if err := json.Unmarshal(v, &obj); err != nil {
				return err
			}

			out = append(out, &obj)
			return nil
		})
	}); err != nil {
		return nil, err
	}

	return out, nil
}
