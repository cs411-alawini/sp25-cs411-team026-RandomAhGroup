import { useState } from "react";
import "./App.css";
import TripPlanner from "./components/TripPlanner";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="container mx-auto py-6">
        <h1 className="text-3xl font-bold text-blue-600">Travel Planner</h1>
      </header>
      <main className="container mx-auto py-8">
        <TripPlanner />
      </main>
    </div>
  );
}

export default App;
