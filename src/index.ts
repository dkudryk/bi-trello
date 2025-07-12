import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'

import { handleBitbucketWebhook } from '../api/bitbucket'
import { handleTrelloWebhook } from '../api/trello'

dotenv.config()

const app = express()

const port = process.env.PORT || 3000

app.use(bodyParser.json())

app.get('/trello', async (req, res) => {
  return res.status(200).json({ message: 'Hello, Trello!' })
})

app.post('/trello', async (req, res) => {
  return handleTrelloWebhook(req as any, res as any)
})

app.post('/bitbucket', async (req, res) => {
  return handleBitbucketWebhook(req as any, res as any)
})

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`)
})
