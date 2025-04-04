# Prach Browse
> A high-performance, privacy-focused server-side browser solution

## Overview

Robust server-side browser that acts as an intermediary between users and the internet. By proxying all web requests through a server, enhances user privacy, eliminates client-side tracking, and provides a cleaner browsing experience. 
This solution allows users to bypass corporate or any other browsing restrictions, under the assumption that the app is hosted remotely.

**Key Features:**

- Server-side rendering of all web content
- Complete URL and search query processing
- Secure file download handling via server intermediation
- Client-side privacy protection from tracking and fingerprinting
- Clean, intuitive user interface

## Privacy Benefits

- **IP Address Protection**: Your actual IP address is never exposed to destination websites
- **Fingerprint Reduction**: Reduces browser fingerprinting capabilities
- **Tracking Prevention**: Blocks common tracking mechanisms
- **Clean Content**: Optional content filtering capabilities
- **Request Anonymization**: All requests appear to come from the server

## Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- 512MB RAM minimum (1GB+ recommended)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/prasifka/prach-browse.git
cd prach-browse

# Install dependencies
npm install

# Start the application
npm start
```

### Docker Installation

```bash
# Build the Docker image
docker build -t prach-browse .

# Run the container
docker run -p 3000:3000 prach-browse
```

## Usage

1. Access browser by navigating to `http://localhost:3000` in your web browser
2. Enter a URL or search query in the address bar
3. Browse the web freely with enhanced privacy

## Configuration

Configuration can be done by modifying the `.env` file:

```
PORT=3000                      # Port to run the server on
DOWNLOAD_DIR=./downloads       # Directory for temporary file storage
CACHE_ENABLED=true             # Enable response caching
CACHE_TTL=3600                 # Cache TTL in seconds
USER_AGENT_ROTATION=true       # Enable rotating user agents
```

## Advanced Usage

### Custom User Agent

```bash
npm start -- --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

### Disable JavaScript Processing

```bash
npm start -- --disable-js
```

### Enable Content Filtering

```bash
npm start -- --content-filter=medium
```

## Development

```bash
# Install development dependencies
npm install --also=dev

# Run in development mode with hot reloading
npm run dev
```
## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License - see the LICENSE file for details.

## Security

This app is designed with security in mind, but is provided as-is without warranty. Users should ensure their server environment is properly secured.

For security issues, please contact me on Discord `Pr4ch`

---

2025 Prach Browse | Privacy-Enhanced Browsing
