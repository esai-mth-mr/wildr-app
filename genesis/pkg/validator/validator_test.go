package validator

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"go.uber.org/zap"
)

func TestValidator(t *testing.T) {
	Convey("Given I have a validator", t, func() {
		validator := NewValidator(ValidatorParams{
			Logger: zap.NewNop(),
		})

		Convey("When I validate a struct", func() {
			type TestStruct struct {
				Name string `validate:"required"`
			}

			err := validator.Validate(&TestStruct{})
			Convey("Then I should get an error", func() {
				So(err, ShouldNotBeNil)
			})
		})
	})
}
