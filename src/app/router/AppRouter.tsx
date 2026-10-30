import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from 'src/pages/HomePage.tsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
