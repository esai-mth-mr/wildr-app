const { exec } = require('child_process')
const fs = require('fs')
if (process.argv.length < 3) {
  console.error('Usage: setEnv <env file path>')
  return 1
}

fs.readFile(process.argv[2], 'utf8', (err, data)=>{
  if(err){
    console.log(`error: ${err.message}`)
    return
  }
  const command = `firebase functions:config:set wildr.config=${Buffer.from( JSON.stringify(JSON.parse(data))).toString('base64')}}`
  exec(command, (error, stdout) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    console.log(`stdout: ${stdout}`)
  })
})
