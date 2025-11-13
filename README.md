## How to Start

### 1. Setup MySQL Instance

Using Docker (recommended):

```bash
docker pull mysql
docker run --name drizzle-mysql -e MYSQL_ROOT_PASSWORD=mypassword -d -p 3306:3306 mysql
```

Full guide: https://orm.drizzle.team/docs/guides/mysql-local-setup

### 2. Configure Environment

Create a `.env` file in the backend directory:

```env
ALT_AUTH_TOKEN=
MYSQL_CONNECTION_URL=
API_PORT=
```

### 3. Install Dependencies and Run

```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:API_PORT` (or the port specified in your `.env` file).

### 4. Initialize Database

On first run, you may need to push the database schema:

```bash
npx drizzle-kit push
```

## API Endpoints

### Health Check

**GET** `/health`

Returns server status and uptime information.

**Response:**

```json
{
  "status": "healthy",
  "service": "Cards API",
  "timestamp": "2025-11-13T12:00:00.000Z",
  "uptime": 123.456
}
```

### Get Cards

**GET** `/api/cards`

Retrieve trading cards with pagination and optional value filters.

**Query Parameters:**

| Parameter  | Type   | Default | Description                        |
| ---------- | ------ | ------- | ---------------------------------- |
| `limit`    | number | 50      | Number of cards to return (1-1000) |
| `offset`   | number | 0       | Number of cards to skip            |
| `minValue` | number | null    | Minimum card market value filter   |
| `maxValue` | number | null    | Maximum card market value filter   |

**Examples:**

```bash
# Get first 50 cards
GET /api/cards

# Get cards 100-149
GET /api/cards?limit=50&offset=100

# Get cards valued between $100 and $200
GET /api/cards?minValue=100&maxValue=200

# Get high value cards (over $200) with pagination
GET /api/cards?minValue=200&limit=100&offset=0
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "beezieTokenId": 37,
      "altAssetId": "a964c762-7aeb-4c50-8fd8-5eb78302a8bd",
      "altMarketValue": "107.15"
    },
    {
      "beezieTokenId": 46,
      "altAssetId": "dbdb6980-3beb-4c41-a5eb-07f912b1aa7d",
      "altMarketValue": "132.79"
    },
    {
      "beezieTokenId": 74,
      "altAssetId": "b801333a-8cf8-45d0-84a6-b8433c289390",
      "altMarketValue": "123.61"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1234,
    "hasMore": true
  },
  "filters": {
    "minValue": 100,
    "maxValue": 200
  }
}
```

### Manual Sync

**POST** `/api/sync`

Manually trigger card synchronization from external sources.

**Response:**

```json
{
  "success": true,
  "message": "Card synchronization triggered successfully"
}
```

**Error (if sync already in progress):**

```json
{
  "success": false,
  "error": "Synchronization already in progress",
  "message": "Please wait for the current sync operation to complete before starting a new one"
}
```

### Rate Limiting

All endpoints are rate limited to 100 requests per 15 minutes per IP address.

## CronService

The CronService manages automated card data updates on a tiered schedule based on card value.

### Update Schedule

| Card Value         | Update Frequency | Cron Expression |
| ------------------ | ---------------- | --------------- |
| High (>$200)       | Daily            | `0 0 * * *`     |
| Medium ($100-$200) | Every 2 days     | `0 0 */2 * *`   |
| Low (<$100)        | Every 3 days     | `0 0 */3 * *`   |

### Process Flow

1. **Fetch Token Details**: Retrieves card data from Beezie service by category or ID
2. **Batch Processing**: Processes cards in batches of 50 with 500ms delay between batches
3. **Enrich with Alt Data**: Fetches market value data from Alt service for each card
4. **Upsert to Database**: Bulk inserts or updates cards in the database

### Key Methods

- `startJobs()`: Initializes all cron schedules
- `syncCards()`: Manual synchronization of all cards (called via API)
- `isSyncing()`: Returns whether synchronization is currently in progress

### Sync Prevention

The service includes a `syncInProgress` flag to prevent concurrent synchronization operations, ensuring data consistency.

## OrdersService

The OrdersService automatically places orders for trading cards based on their market value and wallet balance.

### Order Logic

The service implements the observer pattern by subscribing to card changes via `ICardsChangesListener`.

### Order Placement Rules

1. **Value Filter**: Only places orders for cards valued at **$200 or less**
2. **Balance Check**: Ensures wallet has sufficient balance before each order
3. **Balance Threshold**: Stops all ordering when balance drops **below $100**
4. **Sync Behavior**: Can be configured to skip ordering during initial synchronization

### Process Flow

When cards are updated in the database:

1. Check if sync is in progress and if ordering during sync is disabled
2. For each changed card:
   - Check wallet balance
   - Skip if wallet balance less than threshold
   - Skip if market value exceeds $200
   - Skip if insufficient balance
   - Place order and withdraw funds
