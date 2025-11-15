const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const net = require('net')

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10)
const BUILD_DIR = path.join(__dirname, '..', 'out')

// Function to check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, () => {
      server.once('close', () => resolve(true))
      server.close()
    })
    server.on('error', () => resolve(false))
  })
}

// Function to find available port
async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 10; port++) {
    if (await checkPort(port)) {
      return port
    }
  }
  return null
}

// Main function
async function startServer() {
  let PORT = DEFAULT_PORT
  const availablePort = await findAvailablePort(DEFAULT_PORT)
  
  if (!availablePort) {
    console.error(`\n❌ Could not find available port starting from ${DEFAULT_PORT}`)
    console.log('Please kill the process using port 3000:')
    console.log('  Windows: taskkill /PID 20740 /F')
    console.log('  Or use a different port: PORT=3001 npm start\n')
    process.exit(1)
  }
  
  if (availablePort !== DEFAULT_PORT) {
    console.log(`⚠️  Port ${DEFAULT_PORT} is in use, using port ${availablePort} instead\n`)
    PORT = availablePort
  }

  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain',
  }

  function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    return MIME_TYPES[ext] || 'application/octet-stream'
  }

  function getFilePath(urlPath) {
    // Remove /pora prefix
    let filePath = urlPath.replace(/^\/pora/, '')
    
    // Handle root
    if (!filePath || filePath === '/') {
      filePath = '/index.html'
    }
    
    // Remove leading slash
    filePath = filePath.replace(/^\//, '')
    
    // Join with BUILD_DIR
    return path.join(BUILD_DIR, filePath)
  }

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`)
      const filePath = getFilePath(url.pathname)
      
      // Security: prevent directory traversal
      const normalizedPath = path.normalize(filePath)
      if (!normalizedPath.startsWith(path.normalize(BUILD_DIR))) {
        res.writeHead(403, { 'Content-Type': 'text/plain' })
        res.end('Forbidden')
        return
      }
      
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // If file not found and path starts with /pora, try index.html for SPA
          if (url.pathname.startsWith('/pora') && (url.pathname.endsWith('/') || !path.extname(url.pathname))) {
            const indexPath = path.join(BUILD_DIR, 'index.html')
            fs.readFile(indexPath, (err, data) => {
              if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' })
                res.end('Not Found')
                return
              }
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end(data)
            })
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('Not Found')
          }
          return
        }
        
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' })
            res.end('Internal Server Error')
            return
          }
          
          res.writeHead(200, {
            'Content-Type': getMimeType(filePath),
            'Cache-Control': 'public, max-age=31536000',
          })
          res.end(data)
        })
      })
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
    }
  })

  server.listen(PORT, () => {
    console.log(`\n🚀 Server running at:`)
    console.log(`   Local:   http://localhost:${PORT}/pora/`)
    console.log(`\n`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.\n`)
      console.log('Please do one of the following:')
      console.log(`   1. Kill the process using port ${PORT}:`)
      console.log(`      Windows: netstat -ano | findstr :${PORT}`)
      console.log(`               taskkill /PID <PID> /F`)
      console.log(`      Mac/Linux: lsof -ti:${PORT} | xargs kill`)
      console.log(`\n   2. Use a different port:`)
      console.log(`      PORT=3001 node scripts/serve.js\n`)
      process.exit(1)
    } else {
      console.error('Server error:', err)
      process.exit(1)
    }
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
