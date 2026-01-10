# Space Math 🚀

**Space Math** is an educational arcade game where you defend the galaxy by solving falling math problems. It now features a global leaderboard to compete with pilots around the world!

## 🎮 How to Play

1.  **Customize:** Select your difficulty speed (Easy, Medium, Hard, Expert) and choose which math operations to practice (+, -, *, ÷).
2.  **Start:** Click "Start Mission" to begin.
3.  **Defend:** Asteroids will fall from the top of the screen. Each asteroid contains a math equation.
4.  **Shoot:** Type the numeric answer to the equation using your keyboard and press **ENTER**.
5.  **Power-Ups:** Destroy colored asteroids to activate special effects like Shields, Slow Motion, and Explosions.
6.  **Leaderboard:** Survive as long as you can and submit your high score to the global leaderboard!

## ⚙️ Features

*   **Global Leaderboard:** Compete with other players and save your high scores to the cloud.
*   **4 Difficulty Modes:**
    *   *Easy (Slow)* to *Expert (Extreme)* speed settings.
*   **Customizable Operations:** Toggle specific math types: Addition, Subtraction, Multiplication, Division.
*   **Power-Up System:**
    *   🟠 **Explosion (Orange):** Destroys all active asteroids.
    *   🔵 **Freeze (Blue):** Stops time for 5 seconds.
    *   🟡 **Shield (Yellow):** Protects the base for 10 seconds.
    *   🟢 **Extra Life (Green):** Adds +1 to your lives.
    *   🔴 **Slow Motion (Red):** Slows down time for 5 seconds.
    *   🟣 **Double Points (Purple):** Earn 2x score for 10 seconds.
*   **Boss Battles:** Face a giant, tougher asteroid every 200 points.
*   **Streak System:** Build your streak to set the counter on fire and earn extra lives.
*   **Audio:** Retro synthesized sound effects (no external assets needed).

## 🛠️ Installation & Usage

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [PostgreSQL](https://www.postgresql.org/) (for local database testing)

### Run Locally
1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd space-math
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Database (Optional for local play):**
    *   Create a `.env` file based on `.env.example`.
    *   Add your local PostgreSQL connection string: `DATABASE_URL=postgresql://user:password@localhost:5432/space_math`

4.  **Start the Server:**
    ```bash
    npm start
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Render
See [DEPLOYMENT.md](DEPLOYMENT.md) for a step-by-step guide on deploying this full-stack application to Render.com with a PostgreSQL database.

## 💻 Tech Stack

*   **Frontend:** HTML5 Canvas, CSS3 (Neon UI), Vanilla JavaScript.
*   **Backend:** Node.js, Express.js.
*   **Database:** PostgreSQL.
*   **Hosting:** Render (Web Service + Database).

## 📝 License

Free to use for educational purposes.
