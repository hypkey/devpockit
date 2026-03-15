# DevPockit

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build Status](https://img.shields.io/github/workflow/status/hypkey/devpockit/CI)
![Test Coverage](https://img.shields.io/codecov/c/github/hypkey/devpockit)
![Version](https://img.shields.io/github/package-json/v/hypkey/devpockit)

A modern web application providing essential developer tools with a clean, responsive interface. Built with Next.js 15, featuring 30+ powerful tools that run entirely client-side for optimal performance and privacy.

🌐 **[Production](https://devpockit.hypkey.com/)** | 📖 **[Documentation](#-documentation)** | 🤝 **[Contributing](CONTRIBUTING.md)** | 📝 **[Changelog](CHANGELOG.md)**

## ✨ Features

- **30+ Developer Tools** - JSON formatter, UUID generator, JWT decoder, regex tester, and more
- **Client-Side Processing** - All tools run in your browser, no data sent to servers
- **Modern UI** - Clean, responsive design with dark/light theme support
- **Fast & Reliable** - Built with Next.js 15 and TypeScript
- **Mobile Friendly** - Works seamlessly on desktop, tablet, and mobile devices
- **Open Source** - MIT licensed, free to use and contribute

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommended: Node.js 20+)
- pnpm (package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/hypkey/devpockit.git
cd devpockit

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the application.

For detailed setup instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 🛠️ Available Tools

### Text Tools
- **Lorem Ipsum Generator** - Generate placeholder text
- **Regex Tester** - Test and debug regular expressions
- **Diff Checker** - Compare two texts side-by-side

### Formatters
- **JSON Formatter** - Format and beautify JSON
- **XML Formatter** - Format and beautify XML

### Cryptography & Security
- **UUID Generator** - Generate v1, v4, and v5 UUIDs
- **JWT Decoder** - Decode and analyze JWT tokens
- **JWT Encoder** - Create and encode JWT tokens
- **Hash Generator** - Generate cryptographic hashes (SHA-1, SHA-256, SHA-512, SHA-3)

### Encoders & Decoders
- **QR Code Generator** - Generate QR codes for text, URLs, contacts, WiFi, SMS, email
- **QR Code Decoder** - Decode QR codes from images
- **QR Code Scanner** - Scan QR codes using device camera
- **URL Encoder/Decoder** - Encode and decode URLs
- **Base Encoder/Decoder** - Base64, Base32, Base16, Base85 encoding

### Converters
- **Cron Expression Parser** - Build and parse cron expressions
- **Data Format Converter** - Convert between JSON, YAML, Python Dict, TypeScript Map, XML
- **Timestamp Converter** - Convert between Unix timestamps, ISO 8601, RFC 2822
- **List Format Converter** - Convert lists between different formats
- **Schema Converter** - Convert between JSON Schema, Spark Schema, TypeScript, Python, SQL
- **Number Base Converter** - Convert between binary, octal, decimal, hexadecimal

### Network Tools
- **CIDR Analyzer** - Analyze CIDR notation
- **IP to CIDR Converter** - Convert IP addresses to CIDR
- **IP Address Lookup** - Look up IP address information
- **System Information** - View browser and device information

### Utilities
- **List Comparison** - Compare two lists to find differences
- **JSON Path Finder** - Query JSON using JSONPath
- **XML Path Finder** - Query XML using XPath
- **YAML Path Finder** - Query YAML using YAMLPath
- **JSON/YAML Schema Generator** - Generate JSON Schema from data

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Package Manager**: pnpm
- **Testing**: Jest + React Testing Library

## 📚 Documentation

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines
- **[Security Policy](SECURITY.md)** - Security reporting and practices
- **[Changelog](CHANGELOG.md)** - Version history and changes

For architecture and development documentation, see the [docs](docs/) directory.

## 🚀 Deployment

### Build for Production

```bash
pnpm build
pnpm start
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed deployment instructions.

## 🏠 Self-Hosting

DevPockit runs entirely in the browser and can be self-hosted on GitHub Pages, your own server, or any static hosting platform.

### Quick Start: GitHub Pages

1. **Fork** this repository
2. Go to **Settings → Pages** → set Source to **GitHub Actions**
3. Go to **Actions → Deploy to GitHub Pages** → **Run workflow**

Your instance will be live at `https://<username>.github.io/<repo>/`

### Docker

```bash
docker build -t devpockit .
docker run -p 8080:80 devpockit
```

Visit http://localhost:8080

### Full Guide

See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for GitHub Pages, Docker, nginx, Apache, Caddy, Netlify, Vercel, and Cloudflare Pages.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

Made with ❤️ by the DevPockit community
