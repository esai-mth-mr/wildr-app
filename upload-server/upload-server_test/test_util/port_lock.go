package test_util

import "sync"

var mu sync.Mutex

func LockPort() {
	print("Locking port ", "\n")
	mu.Lock()
}

func UnlockPort() {
	print("Unlocking port ", "\n")
	mu.Unlock()
}
