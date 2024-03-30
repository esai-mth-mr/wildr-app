let fs = require('fs')

let filename = "eb-stdouterr.log"

let content = fs.readFileSync(process.cwd() + "/" + filename).toString()

let parsed = content
    .split(/\n/g)
    .filter(f => f.startsWith('wildr-server'))
    .map(m => m.split('|')[1].trim())
    .filter(f=>f.includes('\x1B[33m\x1B[34mdebug\x1B[33m\x1B[39m\t')||f.includes('\x1B[33m\x1B[31merror\x1B[33m\x1B[39m\t')||f.includes('\x1B[33m\x1B[32minfo\x1B[33m\x1B[39m\t'))
    .map(m=> {
        const temp =  m.split('\x1B[33m');
        const log = temp[temp.length-1].split('\x1B[39m')
        return{
            type: getType(m),
            timestamp: new Date(m.split('\t')[1].split('\x1B')[0].trim()),
            from:  log[0].trim(),
            log: log[1].trim().split(' - ')[0],
            data: JSON.parse(log[1].trim().split(' - ')[1])

        }
    })

function getType(str){
    if(str.includes('\x1B[33m\x1B[34mdebug\x1B[33m\x1B[39m\t'))return 'debug'
    else if(str.includes('\x1B[33m\x1B[31merror\x1B[33m\x1B[39m\t')) return 'error'
    else  if(str.includes('\x1B[33m\x1B[32minfo\x1B[33m\x1B[39m\t')) return 'info'

}


fs.writeFile("output.json", JSON.stringify(parsed.reverse()), function(err) {
    if (err) {
        console.log(err);
    }
});