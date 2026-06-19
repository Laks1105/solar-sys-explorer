import { GestureProvider } from "./GestureContext";
import SolarSystem from "./solarsys";

export default function App() {
  return (
    <GestureProvider>
      <SolarSystem />
    </GestureProvider>
  );
}