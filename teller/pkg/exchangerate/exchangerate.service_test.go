package exchangerate

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/genesis/pkg/validator"
	"github.com/wildr-inc/app/genesis/test"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
)

func TestGetExchangeRate(t *testing.T) {
	var s *ExchangeRateService

	Convey("Given I have an exchange rate service", t, func() {
		lc := fxtest.New(t,
			validator.Module,
			fx.Provide(test.NewLogger),
			fx.Provide(NewExchangeRateService),
			fx.Populate(&s),
		)

		defer lc.RequireStart().RequireStop()

		Convey("When I call GetRate", func() {
			rate, err := s.GetRate(GetRateParams{
				Currency: "USD",
			})
			So(err, ShouldBeNil)

			Convey("Then I should get a rate of 1", func() {
				So(rate, ShouldEqual, 1)
			})
		})

		Convey("When I call GetRate with an UNKNOWN currency", func() {
			rate, err := s.GetRate(GetRateParams{
				Currency: "UNKNOWN",
			})
			So(rate, ShouldEqual, 0)

			Convey("Then I should get an error", func() {
				So(err, ShouldNotBeNil)
			})
		})
	})
}
