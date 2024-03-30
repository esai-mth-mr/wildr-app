package os_test

import (
	"os"
	"testing"

	g_os "github.com/wildr-inc/app/genesis/pkg/os"

	. "github.com/smartystreets/goconvey/convey"
)

func TestEnv(t *testing.T) {
	Convey("When I retrieve env:HOME", t, func() {
		os.Setenv("env:HOME", "bob")
		home := g_os.GetFromEnv("env:HOME")
		Convey("Then I should have a value for env:HOME", func() {
			So(home, ShouldNotBeEmpty)
			So(home, ShouldNotEqual, "env:HOME")
		})
	})

	Convey("When I retrieve bob", t, func() {
		os.Setenv("bob", "bob")
		home := g_os.GetFromEnv("bob")
		Convey("Then I the value should be bob", func() {
			So(home, ShouldNotBeEmpty)
			So(home, ShouldEqual, "bob")
		})
	})
}
