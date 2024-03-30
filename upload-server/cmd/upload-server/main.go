package main

import (
	"fmt"
	"os"

	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/upload-server/pkg/server"
)

func main() {
	os.Setenv("CONFIG_FILE", "./upload-server/config/config.yml")
	_, err := os.Getwd()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	c := cmd.New("0.0.0")
	c.AddServer(server.Module)

	err = c.RunWithArgs([]string{"server"})
	if err != nil {
		panic(err)
	}
}
