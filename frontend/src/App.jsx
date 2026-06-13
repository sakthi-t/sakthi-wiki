import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import WikiPage from './pages/WikiPage.jsx';
import './App.css';

/**
 * Full app routing — Phase 3 complete.
 * Homepage: profile card + project overview + contact form
 * Search: global search with instant results
 * Wiki: dynamic markdown rendering for all projects
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          {/* Wiki routes */}
          <Route path="/wiki/:project/:slug" element={<WikiPage />} />
          <Route path="/wiki/:slug" element={<WikiPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
