package authservice

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/config"
	"github.com/wildr-inc/app/genesis/pkg/validator"
	"github.com/wildr-inc/app/genesis/test"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
)

func TestAuthService(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../../config/config_test.yml")

	var authService *AuthService

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer mockServer.Close()

	Convey("Given I have an auth service", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			fx.Provide(test.NewLogger),
			fx.Provide(NewAuthService),
			fx.Populate(&authService),
		)
		lc.RequireStart()

		Convey("When I try to send a request", func() {

			request := httptest.NewRequest(http.MethodPost, mockServer.URL+"/api/authenticate", nil)

			auth, err := authService.AuthenticateUserWithServer(AuthenticateUserWithServerParams{
				Request: request,
			})

			So(err, ShouldBeNil)
			So(auth, ShouldBeTrue)
		})

		lc.RequireStop()
	})
}
