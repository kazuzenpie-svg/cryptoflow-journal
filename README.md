# 💼 CryptoFlow Journal

<div align="center">
  <img src="public/icon.svg" alt="CryptoFlow Journal" width="80" height="80">
  <h3>Professional Crypto Trading Journal</h3>
  <p>Real-time data sharing between traders and investors with comprehensive analytics</p>
</div>

## ✨ Features

### 👨‍💼 For Traders
- **Trade Journaling**: Record and track all your crypto trades
- **Performance Analytics**: Detailed metrics and performance visualization
- **Portfolio Management**: Real-time portfolio tracking and allocation analysis
- **Investor Sharing**: Share trade data with investors in real-time
- **Profit/Loss Tracking**: Comprehensive P&L analysis with charts

### 👥 For Investors
- **Trader Monitoring**: Track your trader's performance in real-time
- **Investment Analytics**: Monitor your investments and returns
- **Trade Transparency**: Full visibility into trader's trading activity
- **Performance Metrics**: Detailed analytics on trader performance

## 🚀 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database + Auth)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/kazuzenpie-svg/cryptoflow-journal.git

# Navigate to project directory
cd cryptoflow-journal

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

1. Create a `.env.local` file in the root directory
2. Add your Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Progressive Web App

CryptoFlow Journal is PWA-ready with:
- Offline functionality
- App-like experience
- Custom wallet icon
- Installable on mobile and desktop

## 🗄️ Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles (traders/investors)
- `trades` - Trading records
- `portfolios` - Portfolio snapshots
- `trader_investors` - Trader-investor relationships

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the `dist` folder
- **Supabase**: Use Supabase hosting for seamless integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**kazuzenpie-svg**
- GitHub: [@kazuzenpie-svg](https://github.com/kazuzenpie-svg)
- Email: kazuzenpie@gmail.com

---

<div align="center">
  <p>Built with ❤️ for the crypto trading community</p>
</div>
