# Auto Tab Close

A Chrome extension that automatically closes tabs based on URL patterns. Perfect for automatically closing tabs from services like Zoom meetings, Teams meetings, VPN authenticators, Slack calls, and other temporary web applications.

## Features

- Automatically closes tabs that match specific URL patterns
- Configurable URL pattern matching
- Great for cleaning up tabs from:
  - Video conferencing (Zoom, Teams, Google Meet)
  - Authentication popups
  - Session validators
  - Temporary web services
- Simple and intuitive user interface
- Minimal resource usage

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your browser toolbar
2. Add URL patterns you want to auto-close (e.g., "zoom.us/postattendee", "*.webex.com/auth/*")
3. The extension will automatically close any new tabs that match these patterns

## Examples

Common URL patterns you might want to add:
- `zoom.us/j/` - Closes Zoom meeting tabs (closes after 5 minutes)
- `teams.microsoft.com/meet` - Closes Microsoft Teams meeting tabs (closes after 5 minutes)
- `vpn.` - Closes VPN authentication tabs (closes after 5 minutes)
- `webex.com/meet/` - Closes Webex meeting tabs (closes after 5 minutes)
- `gotomeeting.com/join/` - Closes GoToMeeting tabs (closes after 5 minutes)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
