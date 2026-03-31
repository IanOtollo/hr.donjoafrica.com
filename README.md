# Fuse HR & Recruitment Platform

A premium, high-density HR and Recruitment SaaS platform built for scale. Fuse provides an end-to-end talent acquisition and management experience, seamlessly bridging the gap between Employers and Applicants.

![Platform Preview](https://hrdonjoafrica.vercel.app/og-image.png)

## 🚀 Features

### For Platform Administrators & Employers
*   **Dynamic Admin Dashboard**: Real-time analytics, geospatial heatmaps, and system health monitoring.
*   **Centralized Review Queue**: Streamlined interface to review, rate, and shortlist candidates.
*   **Job Posting (CMS)**: Create, manage, and distribute open roles efficiently.
*   **System Announcements**: Broadcast global or targeted alerts to all users on the platform.
*   **Applicant Dossier Export**: Generate and download comprehensive CSV/PDF dossiers of potential hires.

### For Applicants
*   **Premium Neo-Chic UX**: A stunning, glassmorphism-inspired interface with responsive sidebars and intuitive navigation.
*   **Profile Management**: Easily upload dynamic avatars, manage bios, and bind custom `@usernames`.
*   **Application Tracking**: Submit video pitches and track application statuses seamlessly.

## 🛠 Tech Stack

Our stack is modern, strongly-typed, and built for performance:

*   **Framework**: [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom "Neo-Chic" design system
*   **Components**: [shadcn/ui](https://ui.shadcn.com/) & Radix Primitives
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **State & Routing**: React Router v6
*   **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Storage)
*   **Hosting**: [Vercel](https://vercel.com/) (SPA configured)

## 💻 Local Development Setup

To run this platform on your local machine, follow the steps below:

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/IanOtollo/hr.donjoafrica.com.git
cd hr.donjoafrica.com
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials. These are mandatory for the application to function.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Local Server
```bash
npm run dev
```
Navigate to `http://localhost:8080` (or the port specified in your terminal) to view the live app.

## 🚢 Deployment to Vercel

This repository is optimized for deployment on Vercel. A custom `vercel.json` is included to correctly handle React Single Page Application (SPA) routing, ensuring direct links (like `/admin` or `/employer`) do not return 404 errors.

1.  Connect your GitHub repository to [Vercel](https://vercel.com/).
2.  Set the Framework Preset to **Vite**.
3.  Add the Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
4.  Deploy!

## 🤝 Contribution Guidelines

Please ensure that any UI changes strictly adhere to the established "Neo-Chic" aesthetic (glassmorphism, no aggressive centering on dashboards, and maintaining mobile single-column integrity). 
