import React, { useState } from 'react';

interface LandingPageProps {
  onNavigateTo3D?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateTo3D }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      const data = await response.json();
      setSubmitStatus({
        message: data.message || 'Form submitted successfully!',
        type: 'success'
      });
      
      setFormData({
        name: '',
        email: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus({
        message: error instanceof Error ? error.message : 'Something went wrong',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-7xl space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            WonderPlay 3D
          </h1>
          <p className="text-xl text-gray-600">
            Interactive 3D experiences powered by AI
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description Section */}
          <div className="space-y-8">
            <h2 className="text-3xl font-semibold text-gray-800">
              What is WonderPlay 3D NPC Engine?
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              WonderPlay 3D is a universal web-native pipeline for creating intelligent Non-Player Characters (NPCs) 
              that can perceive, reason, and act in 3D environments using advanced AI models.
            </p>
            
            <h3 className="text-2xl font-medium text-gray-800 mb-4">
              Core Capabilities
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-indigo-600">����🧠</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-800">Intelligent Reasoning</h4>
                  <p className="text-gray-600">
                    NPCs analyze environments, make tactical decisions, and adapt behaviors using Gemini AI.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-indigo-600">����👁���</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-800">Visual Perception</h4>
                  <p className="text-gray-600">
                    Process images and video feeds to detect threats, identify objects, and understand surroundings.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-indigo-600">����🎯</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-800">Behavior Control</h4>
                  <p className="text-gray-600">
                    Seamlessly integrate with behavior trees to trigger animations, commands, and state changes.
                  </p>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-medium text-gray-800 mt-8 mb-4">
              How to Build Your Own AI NPCs
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>
                Define your NPC's initial state (health, AI mode, speed, etc.)
              </li>
              <li>
                Set up perception systems (camera feeds, audio inputs, etc.)
              </li>
              <li>
                Connect to our API endpoints for intelligence, vision, and video analysis
              </li>
              <li>
                Process AI responses to trigger behavior tree events and animations
              </li>
              <li>
                Continuously update NPC state based on environmental changes
              </li>
            </ol>
          </div>
          
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Get in Touch
            </h2>
            
            {submitStatus && (
              <div className={`px-4 py-3 rounded mb-6 ${
                submitStatus.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {submitStatus.message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter your name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows={5}
                  placeholder="Enter your message"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting ? 'Submitting...' : 'Send Message'}
                </button>
              </div>
            </form>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>
                We'll get back to you within 24 hours.
              </p>
            </div>
          </div>
        </div>
        
        {/* Explore Button */}
        {onNavigateTo3D && (
          <div className="text-center">
            <button
              onClick={onNavigateTo3D}
              className="inline-flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Explore WonderPlay 3D
            </button>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Powered by Google Gemini AI • Built with React & Three.js
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;