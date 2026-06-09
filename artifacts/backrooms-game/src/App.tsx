import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "./context/GameContext";
import { SettingsProvider } from "./context/SettingsContext";

import MainMenu from "./pages/MainMenu";
import SoloSetup from "./pages/SoloSetup";
import MultiplayerHub from "./pages/MultiplayerHub";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import GameOver from "./pages/GameOver";
import Victory from "./pages/Victory";
import OptionsMenu from "./pages/OptionsMenu";
import SkinSelector from "./pages/SkinSelector";
import NotFound from "./pages/not-found";
import CRTOverlay from "./components/CRTOverlay";
import LoadingScreen from "./components/LoadingScreen";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainMenu} />
      <Route path="/solo" component={SoloSetup} />
      <Route path="/multiplayer" component={MultiplayerHub} />
      <Route path="/lobby/:code" component={Lobby} />
      <Route path="/game/:code" component={Game} />
      <Route path="/gameover" component={GameOver} />
      <Route path="/victory" component={Victory} />
      <Route path="/options" component={OptionsMenu} />
      <Route path="/skin" component={SkinSelector} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SettingsProvider>
          <GameProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <div className="relative w-full h-screen overflow-hidden bg-background text-foreground font-sans">
                <CRTOverlay />
                <Router />
              </div>
            </WouterRouter>
          </GameProvider>
        </SettingsProvider>
        <Toaster />
      </TooltipProvider>

      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
    </QueryClientProvider>
  );
}

export default App;
