import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const taskPrefix = process.env.TASK_PREFIX || 'TID'
const processedActions = new Set<string>()

export async function handleTrelloWebhook(req: VercelRequest, res: VercelResponse) {

  try {
    const { action } = req.body

    if (action?.type !== 'createCard') {
      return res.status(400).json({ error: 'Unsupported action type' })
    }

    const { card } = action.data
    const { id, shortLink } = card

    if (processedActions.has(id)) {
      return res.status(400).json({ error: 'Card was already processed' })
    }

    console.log(`🚀 Card #${id} created`)

    processedActions.add(id)
    setTimeout(() => processedActions.delete(id), 300000)

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

    return res.status(201).json({ message: 'Comment added to Trello' })

  } catch (error) {

    console.error('❌ Error handling Trello webhook:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }

}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Hello, Trello!' })
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  return handleTrelloWebhook(req, res)
}
