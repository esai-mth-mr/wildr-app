package main

import (
	"fmt"
	"os"

	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/teller/pkg/app"
)

func main() {
	os.Setenv("CONFIG_FILE", "./teller/config/config.yml")
	_, err := os.Getwd()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	c := cmd.New("0.0.0")
	c.AddServer(app.Module)

	err = c.RunWithArgs([]string{"server"})
	if err != nil {
		panic(err)
	}
}
