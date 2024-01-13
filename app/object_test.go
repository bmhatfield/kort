package app

import (
	"os"
	"testing"

	bolt "go.etcd.io/bbolt"
)

const (
	testDB     = "test.bdb"
	testBucket = "test"
)

type TestObject struct {
	ObjectID string
	Val      string
}

func (t TestObject) ID() string {
	return t.ObjectID
}

func (t TestObject) WithID(id string) *TestObject {
	t.ObjectID = id
	return &t
}

func WithDB(t *testing.T, fn func(t *testing.T, db *bolt.DB)) {
	defer os.Remove(testDB)

	db, err := bolt.Open(testDB, 0o600, nil)
	if err != nil {
		t.Error(err)
	}
	defer db.Close()

	if err := db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(testBucket))
		return err
	}); err != nil {
		t.Error(err)
	}

	fn(t, db)
}

func TestObject_New(t *testing.T) {
	WithDB(t, func(t *testing.T, db *bolt.DB) {
		o := &Object[*TestObject]{
			db:     db,
			bucket: testBucket,
		}

		to := &TestObject{Val: "v"}
		to, err := o.New(to)
		if err != nil {
			t.Error(err)
		}

		if to.ID() == "" {
			t.Error("id empty")
		}

		if to.ID() != "1" {
			t.Errorf("expected id 1, got %s", to.ID())
		}

		if to.Val != "v" {
			t.Errorf("expected val v, got %s", to.Val)
		}
	})
}
