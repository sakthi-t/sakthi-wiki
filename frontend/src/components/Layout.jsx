import { Outlet } from 'react-router-dom';
import NavBar from './NavBar.jsx';
import Footer from './Footer.jsx';
import './Layout.css';

/**
 * Shared layout: NavBar + page content + Footer.
 */
export default function Layout() {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
