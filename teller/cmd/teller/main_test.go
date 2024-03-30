package main

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/teller/pkg/app"
)

func TestTeller(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../config/config.yml")
	_, err := os.Getwd()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	done := make(chan bool)

	go func() {
		err = cmd.RunServer(app.Module)
		if err != nil {
			panic(err)
		}
	}()

	go func() {
		time.Sleep(2 * time.Second)
		done <- true
	}()

	<-done

	if err != nil {
		panic(err)
	}
}
