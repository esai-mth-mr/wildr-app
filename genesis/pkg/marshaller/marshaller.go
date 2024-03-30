package marshaller

// Marshaller allows to have different ways to marshal/unmarshal.
type Marshaller interface {
	Marshal(v interface{}) ([]byte, error)
	Unmarshal(data []byte, v interface{}) error
}
