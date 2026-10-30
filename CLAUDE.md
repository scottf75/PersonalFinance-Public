# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack personal finance application with:

- **Frontend**: React + TypeScript application built with Vite, using shadcn/ui components and Tailwind CSS
- **Backend**: ASP.NET Core 7.0 Web API with Swagger/OpenAPI support
- **Database**: SQL database (schema in `database/createtables.sql`)
- **Data Access**: PetaPoco ORM for database operations

## Project Structure

```
/
├── frontend/           # React TypeScript frontend
│   ├── src/
│   │   ├── components/ # UI components organized by feature
│   │   ├── pages/      # Route components (Dashboard, Accounts, etc.)
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utilities
├── backend/            # .NET Core API
│   └── PersonalFinance.API/
│       ├── Controllers/ # API controllers
│       ├── Services/    # Business logic services
│       └── Models/      # Data models
└── database/           # SQL schema files
```

## Development Commands

### Frontend (from `/frontend` directory)
- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Build for development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

### Backend (from `/backend/PersonalFinance.API` directory)
- **Run development server**: `dotnet run`
- **Build project**: `dotnet build`
- **Restore packages**: `dotnet restore`

### Solution (from root directory)
- **Build entire solution**: `dotnet build PersonalFinance.sln`

## Key Technologies

### Frontend Stack
- **Vite** - Build tool and dev server
- **React 18** with TypeScript
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Hook Form** + **Zod** - Form handling and validation
- **TanStack Query** - Data fetching and caching
- **Recharts** - Data visualization

### Backend Stack
- **ASP.NET Core 7.0** - Web API framework
- **PetaPoco** - Micro-ORM for database access
- **Swagger/OpenAPI** - API documentation (available in development)

## Service Layer Pattern

The backend uses a service layer pattern:
- Controllers handle HTTP requests/responses
- Services contain business logic (e.g., `ICategoryService`, `CategoryService`)
- Models define data structures
- Services are registered via dependency injection in `Program.cs`