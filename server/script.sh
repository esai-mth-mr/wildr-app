# echo "Yeehaw!"
# cd ~/wildr_app/app/server ; yarn start:dev

# #open -a iterm.app cd ~/wildr_app/app/server ; yarn start:dev
# open -a iterm.app ~/wildr_app/app/server/script.sh


osascript -e 'tell app "Terminal" to do script "cd ~/wildr_app/app/server ; yarn start:dev"'
osascript -e 'tell app "Terminal" to do script "cd ~/wildr_app/app/server ; yarn worker:start:dev"'    