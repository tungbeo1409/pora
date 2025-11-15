const fs = require('fs')
const path = require('path')

// Files to copy from public to out/pora
const filesToCopy = [
  'manifest.json',
  'sw.js',
  'icon-192x192.png',
  'icon-512x512.png',
]

const publicDir = path.join(__dirname, '..', 'public')
const outDir = path.join(__dirname, '..', 'out', 'pora')

// Ensure out/pora directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

// Copy each file
filesToCopy.forEach((file) => {
  const src = path.join(publicDir, file)
  const dest = path.join(outDir, file)

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    console.log(`✓ Copied ${file} to out/pora/`)
  } else {
    console.warn(`⚠ File not found: ${src}`)
  }
})

console.log('PWA files copied successfully!')

