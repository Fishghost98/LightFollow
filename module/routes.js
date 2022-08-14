const fs = require('fs')
const path = require('path')
const url = require('url')

let getMime = function (extname) {
  switch (extname) {
    case '.html':
      return 'text/html'
    case '.css':
      return 'text/css'
    case '.js':
      return 'text/javascript'
    case '.png':
      return 'image/png'
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'application/pdf'
    case '.mp4':
      return 'application/octet-stream'
    default:
      return 'text/html'
  }
}

exports.static = function (req, res, staticPath) {
  let pathname = url.parse(req.url).pathname
  pathname = pathname == '/' ? '/ShowTable.html' : pathname
  let extname = path.extname(pathname)

  if (pathname != '/favicon.ico') {
    try {
      let data = fs.readFileSync('./' + staticPath + pathname)
      if (data) {
        let mime = getMime(extname)
        res.writeHead(200, { 'Content-Type': '' + mime + ';charset="utf-8"' })
        res.end(data)
      }
    } catch (error) {}
  }
}
