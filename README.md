# BI-Trello

A webhook integration service that bridges Bitbucket pull requests and Trello cards, creating a seamless workflow between your development and project management tools.

## 🎯 What it does

This service automatically:

1. **Creates task IDs for new Trello cards** - When a new card is created in Trello, it automatically adds a comment with a unique task ID and git checkout command
2. **Links Bitbucket PRs to Trello cards** - When a pull request is created in Bitbucket that references a task ID, it automatically attaches the PR link to the corresponding Trello card

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:dkudryk/bi-trello.git
   cd bi-trello
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   TRELLO_API_KEY=your_trello_api_key
   TRELLO_TOKEN=your_trello_token
   TASK_PREFIX=TID
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `TRELLO_API_KEY` | Your Trello API key | Required |
| `TRELLO_TOKEN` | Your Trello API token | Required |
| `TASK_PREFIX` | Prefix for task IDs | `TID` |

### Getting Trello API Credentials

1. Go to [Power-Ups Admin](https://trello.com/power-ups/admin)
2. Click on "Create a new Power-Up"
3. Create a Power-Up - after creating it, open its settings.
4. In the API Key / Secrets tab, you will find `API key` and `Secret`
5. Copy `API key` and go to this link, replacing TRELLO_API_KEY with your newly obtained key:
   ```
   https://trello.com/1/authorize?expiration=never&name=MyToken&scope=read,write&response_type=token&key=TRELLO_API_KEY
   ```
6. After allowing, you will get a `token` in the browser — this will be your `TRELLO_TOKEN`.

## 🔗 Webhook Setup

### Trello Webhook Configuration

1. Begin by obtaining the ID of the Trello object you want to monitor (such as a board or card).
   To get the ID of a board or card:

   Take the board URL:

   ```
   https://trello.com/b/<board_id>/my-board
   ```

   Use this API:

   ```
   https://api.trello.com/1/boards/<board_id>?key=TRELLO_API_KEY&token=TRELLO_TOKEN
   ```

   The response will have a field `id`.

2. Send this request to your server:

   ```
   curl -X POST "https://api.trello.com/1/webhooks" \
     -d "key=TRELLO_API_KEY" \
     -d "token=TRELLO_TOKEN" \
     -d "callbackURL=http://your-domain.com/trello-webhook" \
     -d "idModel=<id_of_board_or_card>" \
     -d "description=My Trello webhook"
   ```

   ⚠️ Important:

   `callbackURL` must be publicly accessible with HTTPS.

   Trello checks this URL — when creating a webhook, it sends a HEAD or GET request, and your server must respond with a 200 OK status.

### Bitbucket Webhook Configuration

1. In your Bitbucket repository, go to **Repository settings** → **Webhooks**
2. Add a new webhook with:
   - **URL**: Your server's `/bitbucket` endpoint
   - **Triggers**: Pull request created
   - **Security**: Add authentication if needed

## 🚀 Usage

### Starting the server

```bash
yarn start
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Webhook Endpoints

#### Trello Webhook (`POST /trello`)

Configure this webhook in Trello to trigger when cards are created:

- **URL**: `http://your-domain.com/trello`
- **Triggers**: Card creation events

**What happens:**
- Creates a unique task ID using the format: `{TASK_PREFIX}{card_short_link}`
- Adds a comment to the Trello card with:
  - Task ID
  - Card URL
  - Git checkout command

#### Bitbucket Webhook (`POST /bitbucket`)

Configure this webhook in Bitbucket to trigger when pull requests are created:

- **URL**: `http://your-domain.com/bitbucket`
- **Triggers**: Pull request creation events

**What happens:**
- Scans PR title, description, and branch name for task IDs
- If a matching task ID is found, attaches the PR link to the corresponding Trello card

## 📝 Task ID Format

Task IDs follow the pattern: `{TASK_PREFIX}{card_short_link}`

Example:
- Task Prefix: `TID`
- Card Short Link: `abc123`
- Result: `TIDabc123`

## 🧪 Development

### Running in development mode

```bash
# Add dev script to package.json
"dev": "nodemon src/index.ts"

# Run in development mode
yarn dev
```

### Building for production

```bash
# Build the project
yarn build

# Run compiled JavaScript
node dist/index.js
```

## 📦 Dependencies

### Production
- `express` - Web framework
- `axios` - HTTP client for API calls
- `body-parser` - Request body parsing
- `dotenv` - Environment variable management

### Development
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `nodemon` - Development server with auto-restart
- `@types/*` - TypeScript type definitions

## 👨‍💻 Author

**Dmytro Kudryk** - [dmytro.kudryk@gmail.com](mailto:dmytro.kudryk@gmail.com)
