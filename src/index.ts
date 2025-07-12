import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

const port = process.env.PORT || 3000
const taskPrefix = process.env.TASK_PREFIX || 'TID'

const processedActions = new Set<string>()
const processedPrs = new Set<string>()

app.use(bodyParser.json())

app.get('/trello', async (req, res) => {
  return res.status(200)
})

app.post('/trello', async (req, res) => {
  const { action } = req.body

  if (action?.type === 'createCard') {
    try {
      const { card } = action.data

      const { id, shortLink } = card

      if (processedActions.has(id)) {
        // Duplicate ignored
        return res.status(200)
      }

      processedActions.add(id)
      setTimeout(() => processedActions.delete(id), 300000)

      console.log(`🚀 Card #${id} created`)

      const taskId = `${taskPrefix}${shortLink}`

      await axios.post(`https://api.trello.com/1/cards/${id}/actions/comments`, null, {
          params: {
            key: process.env.TRELLO_API_KEY,
            token: process.env.TRELLO_TOKEN,
            text: `Task ID: **${taskId}**\n\n` +
            `\`\`\`\nhttps://trello.com/c/${shortLink}\n\`\`\`\n` +
            `\`\`\`\ngit checkout -b "${taskId}"`
          }
        })

      console.log('✅ Comment added to Trello')

      return res.status(201)
    } catch (error) {
      console.error('❌ Error handling webhook:', error)
      return res.status(500)
    }
  }
})

app.post('/bitbucket', async (req, res) => {
  try {
    const { pullrequest: pr } = req.body

    const prUrl = pr?.links?.html?.href

    if (!pr || !prUrl) {
      return res.status(400)
    }

    const { author, title, description, source } = pr

    console.log(`🚀 PR #${pr.id} created by ${author.display_name}`)

    if (processedPrs.has(pr.id)) {
      // Duplicate ignored
      return res.status(200)
    }

    processedPrs.add(pr.id)
    setTimeout(() => processedPrs.delete(pr.id), 300000)

    const match = `${title}\n\n${description}\n\n${source.branch.name}`.match(new RegExp(`${taskPrefix}([a-zA-Z0-9]+)`, 'i'))
    const id = match?.[1]

    if (!id) {
      return res.status(200)
    }

    await axios.post(`https://api.trello.com/1/cards/${id}/attachments`, null, {
        params: {
          key: process.env.TRELLO_API_KEY,
          token: process.env.TRELLO_TOKEN,
          name: `🛠 New PR by ${author.display_name}`,
          url: prUrl
        }
      })

    console.log('✅ Attachment with PR link added to Trello')

    return res.status(201)
  } catch (error) {
    console.error('❌ Error handling webhook:', error)
    return res.status(500)
  }
})

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`)
})
