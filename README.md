# CryptoBotRelay

CryptoBotRelay is an automated tool that bridges Discord crypto communities with Telegram trading bots. It automatically detects new contract addresses from Discord and relays them to Telegram bots like Bloom or Maestro for instant trading actions.

Example in slow mode:
![Animation](https://github.com/user-attachments/assets/5314ae0f-a3bc-4b15-985f-cfed4606ec84)


## 🚀 Features

- Real-time Discord message monitoring
- Automatic contract address detection using regex
- Seamless relay to Telegram trading bots
- Support for multiple Telegram bot platforms (Bloom, Maestro, etc.)
- Automated browser interaction handling

## 📋 Requirements

- Node.js (v14 or higher)
- NPM (Node Package Manager)
- Puppeteer (automatically installed via npm)
- Active Discord account
- Active Telegram account
- Access to supported Telegram trading bots

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/wes109/CryptoBotRelay.git
   ```

2. Navigate to the project directory:
   ```bash
   cd CryptoBotRelay
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## 🔧 Usage

1. Start the application:
   ```bash
   node index.js
   ```

2. When prompted, log in to:
   - Discord in the first browser window
   - Telegram in the second browser window

3. The application will automatically:
   - Monitor specified Discord channels
   - Detect new contract addresses
   - Relay them to your configured Telegram bot
   - Trigger the send message action

## ⚙️ Configuration

(Configuration details will be added as the project develops)

## 🔒 Security Notes

- Never share your login credentials
- Keep your authentication tokens secure
- Regularly monitor the bot's activities
- Review all transactions before confirming

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/wes109/CryptoBotRelay/issues).

## 📝 License

This project is [ISC](https://opensource.org/licenses/ISC) licensed.

## ⚠️ Disclaimer

This bot is for educational and experimental purposes only. Always perform your own research and use at your own risk. The creators are not responsible for any financial losses incurred through the use of this tool. 
