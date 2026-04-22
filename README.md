# Smart Expense Sharing Application

A Splitwise-inspired MERN-style assignment focused on backend design, split validation, balance aggregation, and settlement optimization.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- React with Vite for the frontend
- `node:test` for service-level tests

## Features

- Create an expense with:
  - title and optional description
  - payer
  - multiple participants
  - equal or unequal split
- Fetch all expenses
- Delete an expense
- View aggregated balances
- View optimized settlements with reduced transactions
- Handle edge cases:
  - duplicate participants
  - payer not included in participants
  - invalid or missing amounts
  - unequal splits that do not match the total
  - decimal precision using paise instead of floating-point math

## Project Structure

```text
src/
  config/        database connection
  controllers/   request handlers
  middleware/    error handling
  models/        mongoose schemas
  routes/        API routes
  services/      expense logic and settlement logic
  utils/         shared helpers
client/          React frontend source
client-dist/     production frontend build
test/            service-level tests
```

The code follows an MVC-style structure with business rules kept inside services so controllers stay thin.

## Data Modeling

Each expense stores:

- `title`
- `description`
- `amountInPaise`
- `splitType`
- `payer`
- `participants`
- `splits`

Participants are embedded in the expense document because the assignment is centered around expense computation rather than user management/authentication. Amounts are stored in paise to avoid precision drift.

## API Endpoints

### `GET /api/health`

Health check for the API.

### `POST /api/expenses`

Create an expense.

Equal split request:

```json
{
  "title": "Dinner",
  "description": "Friday dinner",
  "amount": "1200",
  "splitType": "equal",
  "payer": { "userId": "u1", "name": "Aisha" },
  "participants": [
    { "userId": "u1", "name": "Aisha" },
    { "userId": "u2", "name": "Rahul" },
    { "userId": "u3", "name": "Meera" }
  ]
}
```

Unequal split request:

```json
{
  "title": "Cab",
  "description": "Airport ride",
  "amount": "900",
  "splitType": "unequal",
  "payer": { "userId": "u1", "name": "Aisha" },
  "participants": [
    { "userId": "u1", "name": "Aisha" },
    { "userId": "u2", "name": "Rahul" }
  ],
  "splits": [
    {
      "participant": { "userId": "u1", "name": "Aisha" },
      "amount": "500"
    },
    {
      "participant": { "userId": "u2", "name": "Rahul" },
      "amount": "400"
    }
  ]
}
```

### `GET /api/expenses`

Fetch all expenses in reverse chronological order.

### `DELETE /api/expenses/:id`

Delete an expense by id.

### `GET /api/expenses/balances`

Returns aggregated balances such as `A owes B`.

### `GET /api/expenses/settlements`

Returns the optimized set of transfers needed to settle all net balances.

## Settlement Logic

The settlement flow is handled in `src/services/settlementService.js`.

### Step 1: Build pair balances

For every split, if the participant is not the payer, the participant owes their split amount to the payer.

### Step 2: Compute net balances

- Negative net balance: user should pay
- Positive net balance: user should receive

### Step 3: Optimize transactions

Two sorted lists are built:

- debtors
- creditors

Then a greedy two-pointer approach matches the largest debtor with the largest creditor until both lists are exhausted. This reduces redundant transfers and returns a compact settlement list.

## Local Setup

1. Install dependencies:

```bash
npm install
```



```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/expense-sharing-app
VITE_API_BASE_URL=
```

3. Start the app in development:

```bash
npm run dev
```

This starts:

- Express API on `http://localhost:5000`
- React frontend on `http://localhost:5173`

4. Open:

```text
http://localhost:5173
```

