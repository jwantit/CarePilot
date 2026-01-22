import { Outlet } from 'react-router-dom';
import Menu from './Menu';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Menu />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

