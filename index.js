const puppeteer = require('puppeteer');
const path = require('path');

// URLs and Configuration
const DISCORD_URL_1 = 'First Discord Channel';
const DISCORD_URL_2 = 'First Discord Channel';
const TELEGRAM_URL = 'Telegram Bot Channel';
const WEBHOOK_URL = 'Discord Webhook';
const USER_DATA_DIR = path.join(__dirname, 'chrome-profile');
const BRAVE_PATH = process.platform === 'win32' 
    ? 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    : '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'; // Mac path

// Track processed addresses with Set for O(1) lookup
const processedAddresses = new Set();
// Keep last 1000 addresses to prevent memory growth
const MAX_PROCESSED_ADDRESSES = 1000;

function formatTimeCentral(date) {
    return date.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
        hour12: true
    });
}

async function sendWebhookNotification(address, foundTime, sentTime, channelNumber) {
    const timeDiff = sentTime - foundTime;
    
    const embed = {
        title: 'New Address Processed',
        color: 0x00ff00,
        fields: [
            {
                name: 'Address',
                value: address,
                inline: false
            },
            {
                name: 'Source',
                value: `Discord Channel ${channelNumber}`,
                inline: false
            },
            {
                name: 'Found Time (CT)',
                value: formatTimeCentral(foundTime),
                inline: true
            },
            {
                name: 'Sent Time (CT)',
                value: formatTimeCentral(sentTime),
                inline: true
            },
            {
                name: 'Processing Time',
                value: `${timeDiff}ms`,
                inline: false
            }
        ]
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed]
            })
        });
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

async function processAddress(address, channelNumber, telegramPage) {
    // Skip if already processed
    if (processedAddresses.has(address)) {
        return false;
    }

    const foundTime = new Date();
    
    try {
        await telegramPage.evaluate(() => {
            const inputField = document.querySelector([
                'div[contenteditable="true"]',
                'div[class*="composer-input"]',
                'div[class*="input-message-input"]',
                'div[role="textbox"]'
            ].join(','));
            if (inputField) {
                inputField.innerHTML = '';
            }
        });
        
        await telegramPage.type([
            'div[contenteditable="true"]',
            'div[class*="composer-input"]',
            'div[class*="input-message-input"]',
            'div[role="textbox"]'
        ].join(','), address);
        
        // Try multiple selectors for the send button
        const sendButtonSelector = [
            'button[class*="btn-send"]',
            'button[aria-label="Send message"]',
            'button[title="Send Message"]',
            'button[class*="send"]',
            'button[class*="submit"]'
        ].join(',');

        // Wait for the button to be visible and clickable
        await telegramPage.waitForSelector(sendButtonSelector, { visible: true });
        
        // Click the button
        await telegramPage.click(sendButtonSelector);
        
        const sentTime = new Date();
        await sendWebhookNotification(address, foundTime, sentTime, channelNumber);

        // Add to processed addresses
        processedAddresses.add(address);
        
        // Remove oldest address if we exceed max size
        if (processedAddresses.size > MAX_PROCESSED_ADDRESSES) {
            const firstAddress = processedAddresses.values().next().value;
            processedAddresses.delete(firstAddress);
        }

        return true;
    } catch (error) {
        console.error('Error processing address:', error);
        return false;
    }
}

async function run() {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--window-size=1920,1080'],
            userDataDir: USER_DATA_DIR,
            executablePath: BRAVE_PATH  // Specify Brave browser path
        });

        const [discordPage1, discordPage2, telegramPage] = await Promise.all([
            browser.newPage(),
            browser.newPage(),
            browser.newPage()
        ]);

        // Navigate to all pages simultaneously
        await Promise.all([
            discordPage1.goto(DISCORD_URL_1, { waitUntil: 'networkidle0' }),
            discordPage2.goto(DISCORD_URL_2, { waitUntil: 'networkidle0' }),
            telegramPage.goto(TELEGRAM_URL, { waitUntil: 'networkidle0' })
        ]);

        console.log('Waiting for Discord and Telegram to be ready...');
        
        // Wait for Discord message elements to be present on both channels
        await Promise.all([
            discordPage1.waitForSelector('li[class*="messageListItem"]', { timeout: 0 }),
            discordPage2.waitForSelector('li[class*="messageListItem"]', { timeout: 0 })
        ]);
        console.log('Discord channels ready');

        // Wait for Telegram input field to be present - try multiple possible selectors
        await telegramPage.waitForSelector([
            'div[contenteditable="true"]',
            'div[class*="composer-input"]',
            'div[class*="input-message-input"]',
            'div[role="textbox"]'
        ].join(','), { timeout: 0 });
        console.log('Telegram ready');

        // Send test address when script starts
        const testAddress = 'HPg5FxpeHbbdAePLxAykcNcPPX9uLSjPDCj6J6MjkopX';
        console.log('Sending test address to Telegram...');
        await processAddress(testAddress, 'TEST', telegramPage);
        console.log('Test address sent successfully');

        // Main monitoring loop
        while (true) {
            try {
                // Get latest messages from both Discord channels simultaneously
                const [messages1, messages2] = await Promise.all([
                    discordPage1.$$eval('li[class*="messageListItem"]', elements => 
                        elements.map(el => el.textContent)
                    ),
                    discordPage2.$$eval('li[class*="messageListItem"]', elements => 
                        elements.map(el => el.textContent)
                    )
                ]);

                // Process both channels' messages
                if (messages1.length > 0) {
                    const lastMessage = messages1[messages1.length - 1];
                    // Skip messages that are replies
                    if (!lastMessage.includes("Replied to @")) {
                        const solanaAddressMatch = lastMessage.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
                        if (solanaAddressMatch) {
                            await processAddress(solanaAddressMatch[0], 1, telegramPage);
                        }
                    }
                }

                if (messages2.length > 0) {
                    const lastMessage = messages2[messages2.length - 1];
                    // Skip messages that are replies
                    if (!lastMessage.includes("Replied to @")) {
                        const solanaAddressMatch = lastMessage.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
                        if (solanaAddressMatch) {
                            await processAddress(solanaAddressMatch[0], 2, telegramPage);
                        }
                    }
                }

                // Minimal delay to prevent CPU overload
                await new Promise(resolve => setTimeout(resolve, 10));
            } catch (error) {
                console.error('Error in monitoring loop:', error);
            }
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Start the script
run().catch(console.error); 