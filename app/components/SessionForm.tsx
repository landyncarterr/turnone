'use client';

import { useState, FormEvent } from 'react';

interface SessionData {
  driver_name: string;
  car: string;
  track: string;
  session_type: string;
  conditions: string;
  best_lap: string;
  avg_lap: string;
  consistency: string;
  driver_notes: string;
}

interface SessionFormProps {
  onSubmit: (data: SessionData) => Promise<void>;
  isLoading: boolean;
}

export default function SessionForm({ onSubmit, isLoading }: SessionFormProps) {
  const [formData, setFormData] = useState<SessionData>({
    driver_name: '',
    car: '',
    track: '',
    session_type: 'Practice',
    conditions: '',
    best_lap: '',
    avg_lap: '',
    consistency: '',
    driver_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      // Don't reset isSubmitting here - let parent component control loading state
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700 mb-2">
            Driver Name *
          </label>
          <input
            type="text"
            id="driver_name"
            name="driver_name"
            value={formData.driver_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., John Smith"
          />
        </div>

        <div>
          <label htmlFor="car" className="block text-sm font-medium text-gray-700 mb-2">
            Car *
          </label>
          <input
            type="text"
            id="car"
            name="car"
            value={formData.car}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Porsche 911 GT3"
          />
        </div>

        <div>
          <label htmlFor="track" className="block text-sm font-medium text-gray-700 mb-2">
            Track *
          </label>
          <input
            type="text"
            id="track"
            name="track"
            value={formData.track}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Circuit of the Americas"
          />
        </div>

        <div>
          <label htmlFor="session_type" className="block text-sm font-medium text-gray-700 mb-2">
            Session Type *
          </label>
          <select
            id="session_type"
            name="session_type"
            value={formData.session_type}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
          >
            <option value="Practice">Practice</option>
            <option value="Qualifying">Qualifying</option>
            <option value="Race">Race</option>
            <option value="Test">Test</option>
          </select>
        </div>

        <div>
          <label htmlFor="conditions" className="block text-sm font-medium text-gray-700 mb-2">
            Track Conditions *
          </label>
          <input
            type="text"
            id="conditions"
            name="conditions"
            value={formData.conditions}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Dry, Wet, Damp"
          />
        </div>

        <div>
          <label htmlFor="best_lap" className="block text-sm font-medium text-gray-700 mb-2">
            Best Lap Time *
          </label>
          <input
            type="text"
            id="best_lap"
            name="best_lap"
            value={formData.best_lap}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., 1:45.234"
          />
        </div>

        <div>
          <label htmlFor="avg_lap" className="block text-sm font-medium text-gray-700 mb-2">
            Average Lap Time *
          </label>
          <input
            type="text"
            id="avg_lap"
            name="avg_lap"
            value={formData.avg_lap}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., 1:46.891"
          />
        </div>

        <div>
          <label htmlFor="consistency" className="block text-sm font-medium text-gray-700 mb-2">
            Lap Time Consistency Notes
          </label>
          <input
            type="text"
            id="consistency"
            name="consistency"
            value={formData.consistency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Consistent within 0.5s"
          />
        </div>
      </div>

      <div>
        <label htmlFor="driver_notes" className="block text-sm font-medium text-gray-700 mb-2">
          Driver Notes
        </label>
        <textarea
          id="driver_notes"
          name="driver_notes"
          value={formData.driver_notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
          placeholder="Any additional notes or observations from the driver..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full bg-[#E10600] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading || isSubmitting ? 'Generating… this can take ~10–20 seconds' : 'Generate Performance Report'}
      </button>
    </form>
  );
}

