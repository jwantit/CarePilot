import { RouterProvider } from 'react-router-dom';
import router from './router/rootRouter';
import Toast from './components/common/Toast';
import './App.css';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toast />
    </>
  );
}

export default App;