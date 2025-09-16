import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ComponentUsageExample from '@/examples/ComponentUsageExample';

/**
 * Demo route for testing UI components
 * Add this to your main router to test the components
 */
export const DemoRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/demo/components" element={<ComponentUsageExample />} />
    </Routes>
  );
};

export default DemoRoutes;