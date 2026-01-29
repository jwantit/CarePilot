import { useEffect } from 'react';
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import router from "./router/rootRouter";
import Toast from "./components/common/Toast";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { store } from "./store/store";
import { setupApiInterceptors } from "./api/apiClient";
import "./App.css";

function App() {
  useEffect(() => {
    // API 인터셉터 설정 (앱 시작 시 한 번만)
    setupApiInterceptors();
  }, []);

  return (
    <Provider store={store}>
      <WebSocketProvider>
        <RouterProvider router={router} />
        <Toast />
      </WebSocketProvider>
    </Provider>
  );
}

export default App;
