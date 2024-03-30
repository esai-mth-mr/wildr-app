package test

import (
	"github.com/wildr-inc/app/genesis/pkg/marshaller"
)

// NewMarshaller for test.
func NewMarshaller(err error) marshaller.Marshaller {
	return &mar{err: err}
}

type mar struct {
	err error
}

func (m *mar) Marshal(_ any) ([]byte, error) {
	return nil, m.err
}

func (m *mar) Unmarshal(_ []byte, _ any) error {
	return m.err
}
