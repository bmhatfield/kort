package app

import (
	"strconv"

	"github.com/vmihailenco/msgpack/v5"
	bolt "go.etcd.io/bbolt"
)

type Identifiable[T any] interface {
	ID() string
	WithID(string) T
}

type Object[T Identifiable[T]] struct {
	db     *bolt.DB
	bucket string
}

func (o *Object[T]) New(obj T) (T, error) {
	if err := o.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		seq, err := bucket.NextSequence()
		if err != nil {
			return err
		}

		obj = obj.WithID(strconv.Itoa(int(seq)))

		b, err := msgpack.Marshal(obj)
		if err != nil {
			return err
		}

		return bucket.Put(Key(obj.ID()), b)
	}); err != nil {
		return obj, err
	}

	return obj, nil
}

func (o *Object[T]) Replace(obj T) error {
	return o.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		b, err := msgpack.Marshal(obj)
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
		if bucket == nil {
			return ErrNoBucket
		}

		b := bucket.Get(Key(id))
		if b == nil {
			return ErrNotFound
		}

		return msgpack.Unmarshal(b, &obj)
	}); err != nil {
		return obj, err
	}

	return obj, nil
}

func (o *Object[T]) List() ([]T, error) {
	out := make([]T, 0)
	if err := o.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		return bucket.ForEach(func(k, v []byte) error {
			var obj T
			if err := msgpack.Unmarshal(v, &obj); err != nil {
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

func (o *Object[T]) Delete(id string) error {
	return o.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(Key(o.bucket))
		if bucket == nil {
			return ErrNoBucket
		}

		return bucket.Delete(Key(id))
	})
}
