for ((i=1;i<=200;i++))
do
		# Target existing service’s routes
		curl -s https://dev.api.wildr.com/health -A dd-test-scanner-log;
		# Target non existing service’s routes
		curl -s https://dev.api.wildr.com/missing-route -A dd-test-scanner-log;
done
