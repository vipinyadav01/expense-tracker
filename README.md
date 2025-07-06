# Expense Tracker Pro

A modern, AI-powered expense tracking and financial insights web app built with Next.js, Clerk, Supabase, and Tailwind CSS.

## Features
- **Authentication:** Secure sign-in/sign-up with Clerk
- **Expense Tracking:** Add, edit, and manage transactions
- **Budgets:** Set and monitor budgets for categories
- **AI Insights:** Get smart financial insights (Google Generative AI)
- **Visual Analytics:** Interactive charts and dashboards
- **Export:** Download your data as CSV or PDF
- **Dark/Light Mode:** Toggle with a single click
- **Mobile Responsive:** Works great on all devices
- **Modern UI:** Uses Ultra and Anurati fonts for a unique look
- **Indian Rupee (₹) Support:** All currency values are shown in ₹

## Tech Stack
- [Next.js 14](https://nextjs.org/)
- [React 18](https://react.dev/)
- [Clerk](https://clerk.com/) (authentication)
- [Supabase](https://supabase.com/) (database)
- [Tailwind CSS](https://tailwindcss.com/) (styling)
- [Lucide React](https://lucide.dev/) (icons)
- [Google Generative AI](https://ai.google.dev/)

## Fonts
- **Ultra:** Used for headings and branding (Google Fonts)
- **Anurati:** Used for special display text (add `Anurati-Regular.otf` to `public/fonts` and import in your CSS)
- **Inter:** Used for body text

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

### 2. Install dependencies
```bash
pnpm install # or npm install or yarn install
```

### 3. Set up environment variables
Create a `.env.local` file with your Clerk and Supabase credentials:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Fonts
- **Ultra:** Already included via Google Fonts in the codebase.
- **Anurati:** Download `Anurati-Regular.otf` and place it in `public/fonts/`. Add this to your `app/globals.css`:
  ```css
  @font-face {
    font-family: 'Anurati';
    src: url('/fonts/Anurati-Regular.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  ```
- Use `className="font-ultra"` or `className="font-anurati"` in your components as needed (see `tailwind.config.ts`).

### 5. Run the development server
```bash
pnpm dev # or npm run dev or yarn dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts
- `pnpm dev` — Start the development server
- `pnpm build` — Build for production
- `pnpm start` — Start the production server
- `pnpm lint` — Lint the codebase

## Customization
- **Theme:** Easily switch between dark and light mode
- **Currency:** All values use the Indian Rupee (₹)
- **Fonts:** Customize fonts in `tailwind.config.ts` and `globals.css`

## License
[MIT](LICENSE) 

## Tailwind Config
```
theme: {
  extend: {
    fontFamily: {
      anurati: ['Anurati', 'Ultra', 'Inter', 'sans-serif'],
      // ...other fonts
    },
  },
}, 