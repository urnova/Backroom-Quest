import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "./context/GameContext";

import MainMenu from "./pages/MainMenu";
import SoloSetup from "./pages/SoloSetup";
import MultiplayerHub from "./pages/MultiplayerHub";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import GameOver from "./pages/GameOver";
import Victory from "./pages/Victory";
import NotFound from "./pages/not-found";
import CRTOverlay from "./components/CRTOverlay";

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="relative w-full h-screen overflow-hidden bg-background text-foreground font-sans">
              <CRTOverlay />
              <Router />
            </div>
          </WouterRouter>
        </GameProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
