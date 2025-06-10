import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { Dialog, DialogContent } from "./ui/dialog";

interface WelcomeModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // Only start loading video when modal opens
  useEffect(() => {
    if (open) {
      setShouldLoadVideo(true);
    }
  }, [open]);

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
  };

  const handleVideoError = () => {
    setIsVideoLoading(false);
    setHasVideoError(true);
  };

  const handleClose = () => {
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-5xl w-[90vw] !p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          className="absolute top-4 right-4 h-8 w-8 p-0 border-slate-300 text-slate-600 hover:bg-slate-50 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Polished Header */}
        <div className="text-center px-8 pt-10 pb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="rounded-xl">
              <Logo className="h-10 w-10 text-slate-800" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Welcome to BlockDL
              </h1>
            </div>
          </div>
          <p className="text-slate-600 text-xl leading-relaxed max-w-2xl mx-auto font-light">
            Build neural network architectures visually with intuitive
            drag-and-drop blocks
          </p>
        </div>

        {/* Video Section */}
        <div className="relative px-8 pb-8">
          {isVideoLoading && (
            <div className="absolute inset-0 mx-8 flex items-center justify-center bg-slate-100 aspect-video rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                <p className="text-slate-600 text-sm">Loading demo video...</p>
              </div>
            </div>
          )}

          {hasVideoError ? (
            <div className="flex items-center justify-center bg-slate-100 aspect-video rounded-lg">
              <div className="text-center p-8">
                <Play className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Demo Video Unavailable
                </h3>
                <p className="text-slate-600">
                  The demo video could not be loaded.
                </p>
              </div>
            </div>
          ) : (
            shouldLoadVideo && (
              <video
                className="w-full aspect-video block object-cover rounded-lg"
                autoPlay
                muted
                loop
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
              >
                <source src="/demo-optimized.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
