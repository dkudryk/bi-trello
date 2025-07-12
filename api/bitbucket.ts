import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const processedPrs = new Set<string>()

const taskPrefix = process.env.TASK_PREFIX || 'TID'

export async function handleBitbucketWebhook(req: VercelRequest, res: VercelResponse) {

  try {

    const { pullrequest: pr } = req.body

    const prUrl = pr?.links?.html?.href

    if (!pr || !prUrl) {
      return res.status(400).json({ error: 'Missing pull request data' })
    }

    const { author, title, description, source } = pr

    if (processedPrs.has(pr.id)) {
      return res.status(400).json({ error: 'PR was already processed' })
    }

    console.log(`🚀 PR #${pr.id} created by ${author.display_name}`)

    processedPrs.add(pr.id)
    setTimeout(() => processedPrs.delete(pr.id), 300000)

    const match = `${title}\n${description}\n${source.branch.name}`.match(new RegExp(`${taskPrefix}([a-zA-Z0-9]+)`, 'i'))
    const id = match?.[1]

    if (!id) {
      return res.status(400).json({ error: 'PR content does not contain task ID' })
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

    return res.status(201).json({ message: 'PR processed successfully' })

  } catch (error) {

    console.error('❌ Error handling Bitbucket webhook:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  return handleBitbucketWebhook(req, res)
}
