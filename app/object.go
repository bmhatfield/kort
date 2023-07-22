package app

import (
	"encoding/json"
	"strconv"

	bolt "go.etcd.io/bbolt"
)

type Identifer interface {
	ID() string
	SetID(string)
}

type Object[T Identifer] struct {
	db     *bolt.DB
	bucket string
}

func (o *Object[T]) New(obj T) (string, error) {
	id := ""
	if err := o.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))

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

func (o *Object[T]) Replace(obj T) error {
	return o.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))

		b, err := json.Marshal(obj)
		if err != nil {
			return err
		}

		return bucket.Put(Key(obj.ID()), b)
	})
}

func (o *Object[T]) Get(id string) (T, error) {
	var obj T
	if err := o.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		b := bucket.Get(Key(id))
		if b == nil {
			return ErrNotFound
		}

		return json.Unmarshal(b, obj)
	}); err != nil {
		return obj, err
	}

	return obj, nil
}

func (o *Object[T]) List() ([]T, error) {
	out := make([]T, 0)
	if err := o.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		return bucket.ForEach(func(k, v []byte) error {
			var obj T
			if err := json.Unmarshal(v, obj); err != nil {
				return err
			}

			out = append(out, obj)
			return nil
		})
	}); err != nil {
		return nil, err
	}

	return out, nil
}
