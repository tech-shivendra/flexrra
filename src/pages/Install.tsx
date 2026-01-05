import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Smartphone, CheckCircle, Share, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Install = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border/50">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          ← Back
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* App Icon */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 shadow-glow">
          <Smartphone className="w-12 h-12 text-primary-foreground" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Install Flexrra</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Add Flexrra to your home screen for quick access to all your gym sessions
        </p>

        {isInstalled ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <p className="text-success font-medium">App already installed!</p>
            <Button onClick={() => navigate('/')} variant="gradient" size="lg">
              Open App
            </Button>
          </div>
        ) : isIOS ? (
          <div className="space-y-6">
            <div className="bg-card/50 rounded-xl p-6 border border-border/50 max-w-sm">
              <h3 className="font-semibold mb-4">To install on iPhone/iPad:</h3>
              <ol className="text-left space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <span>
                    Tap the <Share className="inline w-4 h-4" /> Share button in Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <span>
                    Scroll down and tap <Plus className="inline w-4 h-4" /> "Add to Home Screen"
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>Tap "Add" to confirm</span>
                </li>
              </ol>
            </div>
          </div>
        ) : isInstallable ? (
          <Button onClick={handleInstall} variant="gradient" size="xl" className="gap-2">
            <Download className="w-5 h-5" />
            Install App
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Open this page in Chrome or Edge to install the app
            </p>
            <Button onClick={() => navigate('/')} variant="outline" size="lg">
              Continue to Website
            </Button>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm w-full">
          <div className="bg-card/30 rounded-lg p-4 border border-border/30">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm font-medium">Quick Access</p>
            <p className="text-xs text-muted-foreground">Launch instantly from home screen</p>
          </div>
          <div className="bg-card/30 rounded-lg p-4 border border-border/30">
            <div className="text-2xl mb-2">📴</div>
            <p className="text-sm font-medium">Works Offline</p>
            <p className="text-xs text-muted-foreground">Access key features anytime</p>
          </div>
          <div className="bg-card/30 rounded-lg p-4 border border-border/30">
            <div className="text-2xl mb-2">🔔</div>
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">Get workout reminders</p>
          </div>
          <div className="bg-card/30 rounded-lg p-4 border border-border/30">
            <div className="text-2xl mb-2">📱</div>
            <p className="text-sm font-medium">Native Feel</p>
            <p className="text-xs text-muted-foreground">Full-screen app experience</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Install;
