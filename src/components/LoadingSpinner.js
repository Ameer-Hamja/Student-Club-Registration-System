import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
      <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" 
           style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
    </div>
    <p className="text-white/50 text-sm">{message}</p>
  </div>
);

export default LoadingSpinner;
