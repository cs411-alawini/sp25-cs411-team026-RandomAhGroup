import { useState } from "react";

function TripPlanner() {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Trip details:", { location, startDate, endDate });
    // Here you would typically send this data to your backend
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Plan Your Trip</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="location"
            className="block text-gray-700 font-medium mb-2"
          >
            Destination
          </label>
          <input
            type="text"
            id="location"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Where are you going?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label
              htmlFor="startDate"
              className="block text-gray-700 font-medium mb-2"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-gray-700 font-medium mb-2"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Plan My Trip
        </button>
      </form>
    </div>
  );
}

export default TripPlanner;
