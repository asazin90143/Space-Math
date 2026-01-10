# Deploying Space Math to Render

This guide will help you deploy your Space Math game with a PostgreSQL database on Render.

## Prerequisites
- A GitHub account
- A Render account (https://render.com)

## Step 1: Push Code to GitHub
1. Create a new repository on GitHub.
2. Push this project code to the new repository.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 2: Create a Database on Render
1. Go to your **Render Dashboard**.
2. Click **New +** and select **PostgreSQL**.
3. Name it (e.g., `space-math-db`).
4. Select the **Free** plan.
5. Click **Create Database**.
6. Wait for it to be created.
7. **Important:** Copy the `Internal Database URL` (we will use this later).

## Step 3: Deploy the Web Service
1. Go to your **Render Dashboard**.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Name:** `space-math-game`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. **Environment Variables:**
   - Scroll down to "Environment Variables".
   - Add Key: `DATABASE_URL`
   - Paste Value: (The `Internal Database URL` you copied earlier).
6. Click **Create Web Service**.

## Step 4: Initialize the Table
Since we added code to `server.js` to automatically create the table if it doesn't exist, the database will be ready as soon as the deployment finishes!

```javascript
// This code in server.js does it automatically:
// CREATE TABLE IF NOT EXISTS scores ...
```

## Step 5: Play!
Once deployed, Render will give you a URL (e.g., `https://space-math-game.onrender.com`). Open it and check the Leaderboard!
