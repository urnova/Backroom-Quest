import { useSettings } from "../context/SettingsContext";

export default function CRTOverlay() {
  const { settings } = useSettings();
  return (
    <>
      {settings.graphics.crtEffect && <div className="crt-overlay pointer-events-none" />}
      {settings.graphics.filmGrain && <div className="film-grain pointer-events-none" />}
      {settings.graphics.vignette && <div className="vignette pointer-events-none" />}
    </>
  );
}
