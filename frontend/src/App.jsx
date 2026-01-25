import { RouterProvider } from 'react-router-dom';
import router from './router/rootRouter';
import Toast from './components/common/Toast';
import { WebSocketProvider } from './contexts/WebSocketContext';
import './App.css';

function App() {
  return (
    <WebSocketProvider>
      <RouterProvider router={router} />
      <Toast />
    </WebSocketProvider>
  );
}

export default App;