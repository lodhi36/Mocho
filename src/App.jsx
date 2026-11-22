import { Show, createSignal, onMount } from 'solid-js';
import { AppRoutes } from './routes/AppRoutes.jsx';
import { ConfirmDialog, ToastContainer } from './components/ui/Modal.jsx';
import { SplashScreen } from './components/ui/SplashScreen.jsx';
import { startLiveLocationTracking } from './stores/locationStore.js';

export default function App() {
  const [showSplash, setShowSplash] = createSignal(true);

  onMount(() => {
    startLiveLocationTracking();
  });

  return (
    <>
      <Show when={showSplash()}>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </Show>
      <AppRoutes />
      <ToastContainer />
      <ConfirmDialog />
    </>
  );
}
