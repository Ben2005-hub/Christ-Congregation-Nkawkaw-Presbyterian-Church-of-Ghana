Running the backend continuously (Windows)
---------------------------------------

Options to keep the server running so you don't get "server error" when you return:

1) Use the included PowerShell helpers (quick, lightweight)

  - Start server in background:

    ```powershell
    cd server
    .\start-server.ps1
    ```

  - Stop server:

    ```powershell
    cd server
    .\stop-server.ps1
    ```

  These scripts start Node in the background and write the PID to `.server.pid`.

2) Use PM2 (recommended for development/production)

  - Install PM2 globally:

    ```powershell
    npm install -g pm2
    pm2 start index.js --name church-app-server
    pm2 save
    pm2 startup
    ```

  PM2 will respawn the process if it crashes and can be configured to start on boot.

3) Use Windows Task Scheduler

  Create a scheduled task that runs the `start-server.ps1` script at login.

Notes
-----
- Make sure `server/.env` exists locally with your environment values (JWT_SECRET, TWILIO_* keys). Do NOT commit `.env` to the repo.
- For testing from your phone, run the front-end with host accessible on LAN: `npm run dev -- --host` (Vite) and then open the dev URL with your PC's IP from the phone browser.
