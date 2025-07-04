# **App Name**: TradeSim

## Core Features:

- Intro Section: Intro Section: Displays the game title, a brief description, and a 'Play' button to start the trading game simulation.
- Game Container: Game Container: After the user clicks the Play button, the game interface appears, including a balance display, a trade chart, buy/sell buttons, and notifications.
- Trading Chart: Trading Chart: Uses Canvas API to render a dynamic chart that simulates the volatility of binary options, updating every 2 seconds using setInterval.
- Game Logic: Game Logic: Implements core trading functionality, including updating the balance based on simulated trades (buy/sell), with each trade resulting in a gain or loss of R$50.
- Notifications: Notifications: Provides real-time feedback on trade outcomes and market trends (e.g., 'BUY signal! Upward trend in 3...2...1...')
- Sound Effects: Sound Effects: Adds audio cues for wins and losses to enhance the gaming experience, providing clear, immediate feedback.
- Balance Persistence: Balance Persistence: Uses browser storage (cookies or sessionStorage) to save the player's balance, ensuring it persists across page reloads.

## Style Guidelines:

- Primary color for gains: Green (#00C853) to indicate successful trades and increases in balance.
- Primary color for losses: Red (#FF3D00) to indicate unsuccessful trades and decreases in balance.
- Background color: Dark gray (#121212) to provide a high-contrast, immersive trading environment.
- Card background color: Light gray (#1E1E1E) for UI elements to stand out against the dark background while maintaining a modern look.
- Font: 'Inter' sans-serif for a clean and modern look, suitable for both the headings and body text within the trading interface.
- The layout should prioritize the arrangement of trade information such as game intro, live chart, notification and trading operation buttons.
- Subtle pulse animation effects on the balance value to highlight gains or losses.