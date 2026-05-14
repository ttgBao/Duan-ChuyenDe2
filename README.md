# TDC Second-Hand Marketplace

A comprehensive mobile application platform designed for students (specifically tailored for Cao Đẳng CN Thủ Đức - TDC) to effortlessly buy, sell, and exchange second-hand goods. The platform integrates a powerful AI assistant that helps users automatically generate product descriptions, suggest market prices, and categorize items simply by uploading a product image.

## 🚀 Features

* **Smart Product Posting:** Leverage AI to automatically scan images, generate SEO-friendly descriptions, and suggest competitive prices.
* **Buy, Sell & Exchange:** Flexible transaction methods including direct purchases, free giveaways, and item exchanges.
* **Real-time Chat & Notifications:** Communicate seamlessly with buyers and sellers using integrated WebSocket chat and instant push notifications.
* **Community Groups:** Join or create specific groups to trade items within trusted student communities.
* **Advanced Search & Filtering:** Find exactly what you need with robust search, categorization, and filtering by condition, price, and deal type.
* **User Authentication:** Secure login, registration, and profile management.

## 🛠️ Technology Stack

* **Mobile Frontend:** React Native, Expo, NativeWind (TailwindCSS)
* **Backend API:** NestJS, TypeORM, TypeScript
* **AI Microservice:** Python, FastAPI, Gemini API, Ollama (for localized AI processing)
* **Real-time Communication:** Socket.io

## 📂 Project Structure

* `/docu`: The React Native Expo mobile application.
* `/backend/deadcells`: The NestJS backend providing RESTful APIs and Socket.io endpoints.
* `/ai-service`: A Python FastAPI microservice handling AI image analysis, text generation, and price suggestions.

## 🚦 Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Expo CLI

### 1. Setup Backend (NestJS)
```bash
cd backend/deadcells
npm install
# Configure your .env variables (Database, JWT, etc.)
npm run start:dev
```

### 2. Setup AI Service (Python)
```bash
cd ai-service
pip install -r requirements.txt
# Configure your .env variables (GEMINI_API_KEY, etc.)
uvicorn main:app --reload
```

### 3. Setup Mobile App (Expo)
```bash
cd docu
npm install
# Ensure you update the API endpoint paths in docu/config.ts
npx expo start
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is developed for educational purposes and community use.
