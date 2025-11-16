import React, { useState } from "react";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonPanel from "@/components/NeonPanel";
import TextIconButton from "@/components/ui/TextIconButtons";

export default function AddMediaResourceForm({ onSuccess }: { onSuccess?: () => void }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  function isValidMediaUrl(url: string) {
    // Basic check for YouTube, Vimeo, Instagram, SoundCloud, etc.
    return /^(https?:\/\/(www\.)?(youtube|youtu\.be|vimeo|instagram|soundcloud)\.)/i.test(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please enter a name for this resource.");
      return;
    }
    if (!isValidMediaUrl(url)) {
      setError("Please enter a valid YouTube, Vimeo, Instagram, or SoundCloud URL.");
      return;
    }
    setLoading(true);
    // TODO: Save the media resource to your backend or state here
    setTimeout(() => {
      setLoading(false);
      setUrl("");
      setName("");
      setShowSuccess(true);
      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 2000);
    }, 800);
  }

  return (
    <>
      <form className="neon-form" onSubmit={handleSubmit} style={{ minWidth: 320 }}>
        <label>
          Name
          <input
            className="neon-input"
            type="text"
            placeholder="Resource name/title"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Video/Audio URL
          <input
            className="neon-input"
            type="url"
            placeholder="Paste a YouTube, Vimeo, Instagram, or SoundCloud URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
        </label>
        {error && <div className="training-card training-danger">{error}</div>}
        <TextIconButton
          variant="next"
          label={loading ? "Adding…" : "Add Resource"}
          type="submit"
          disabled={loading}
        />
      </form>
      {showSuccess && (
        <OverlayDialog showCloseButton={true} open={showSuccess} onClose={() => setShowSuccess(false)} ariaLabelledby="media-success-title">
          <NeonPanel>
            <h2 id="media-success-title">Resource Added!</h2>
          </NeonPanel>
        </OverlayDialog>
      )}
    </>
  );
}
