import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'bizempire_seen_pwa_prompt';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
         (window.navigator as any).standalone === true;
}

export function AddToHomeScreenModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Don't show if already installed or already seen
    if (isStandalone()) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;
    
    // Show after a short delay
    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const ios = isIOS();
  const android = isAndroid();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            📱 Install the App
          </DialogTitle>
          <DialogDescription className="text-center">
            Add BizEmpire to your home screen for the best experience!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {ios && (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">1️⃣</span>
                <span>Tap the <strong>Share</strong> button <span className="inline-block align-middle">⬆️</span> at the bottom of Safari</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">2️⃣</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">3️⃣</span>
                <span>Tap <strong>"Add"</strong> in the top right</span>
              </div>
            </div>
          )}

          {android && (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">1️⃣</span>
                <span>Tap the <strong>menu</strong> button <span className="inline-block align-middle">⋮</span> in Chrome</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">2️⃣</span>
                <span>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">3️⃣</span>
                <span>Confirm by tapping <strong>"Add"</strong></span>
              </div>
            </div>
          )}

          {!ios && !android && (
            <div className="space-y-3 text-sm text-center">
              <p>Look for an <strong>"Install"</strong> or <strong>"Add to Home Screen"</strong> option in your browser's menu.</p>
              <p className="text-muted-foreground">This works best on mobile devices!</p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-3 text-center text-sm">
            <span className="text-lg">✨</span> Play offline, get faster loading, and enjoy a full-screen experience!
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleDismiss} 
            className="w-full relative z-10"
            style={{ touchAction: 'manipulation' }}
          >
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}