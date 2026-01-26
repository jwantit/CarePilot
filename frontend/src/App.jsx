import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import router from "./router/rootRouter";
import Toast from "./components/common/Toast";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { store } from "./store/store";
import "./App.css";

function App() {
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
