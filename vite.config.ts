import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

function datasetSyncPlugin(): Plugin {
  return {
    name: 'dataset-sync-plugin',
    configureServer(server) {
      server.middlewares.use('/api/dataset/append', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { csvRows, orderId } = JSON.parse(body)
              if (csvRows && typeof csvRows === 'string') {
                const csvPath = path.resolve(process.cwd(), 'public/tarri_data.csv')
                if (fs.existsSync(csvPath)) {
                  let existing = fs.readFileSync(csvPath, 'utf8')
                  if (orderId) {
                    const lines = existing.split(/\r?\n/).filter((l) => !l.startsWith(orderId + ','))
                    existing = lines.join('\n')
                  }
                  if (!existing.endsWith('\n')) {
                    existing += '\n'
                  }
                  fs.writeFileSync(csvPath, existing + csvRows.trim() + '\n')
                }
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true }))
                return
              }
            } catch (err: any) {
              console.error('Error appending to CSV on disk:', err)
            }
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Failed to append to dataset' }))
          })
        } else {
          res.statusCode = 405
          res.end()
        }
      })

      server.middlewares.use('/api/dataset/update-order', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { orderId, cancelled, payment } = JSON.parse(body)
              const csvPath = path.resolve(process.cwd(), 'public/tarri_data.csv')
              if (fs.existsSync(csvPath)) {
                const content = fs.readFileSync(csvPath, 'utf8')
                const lines = content.split(/\r?\n/)
                const updatedLines = lines.map((line) => {
                  if (!line.startsWith(orderId + ',')) return line
                  const parts = line.split(',')
                  if (parts.length >= 14) {
                    if (payment !== undefined) parts[12] = payment
                    if (cancelled !== undefined) parts[13] = cancelled ? 'Yes' : 'No'
                    return parts.join(',')
                  }
                  return line
                })
                fs.writeFileSync(csvPath, updatedLines.join('\n'))
              }
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
              return
            } catch (err: any) {
              console.error('Error updating order in CSV on disk:', err)
            }
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Failed to update order in dataset' }))
          })
        } else {
          res.statusCode = 405
          res.end()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), datasetSyncPlugin()],
})
