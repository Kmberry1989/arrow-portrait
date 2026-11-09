import { useRef, useState } from 'react';
import { CloseIcon, UploadIcon } from './Icons';

interface SetupViewProps {
  onClose: () => void;
  onGenerate: (file: File, crop: { x: number; y: number }) => Promise<void>;
  generating: boolean;
  progress: number;
  progressLabel: string;
}

export function SetupView({ onClose, onGenerate, generating, progress, progressLabel }: SetupViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; cropX: number; cropY: number } | undefined>(undefined);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [crop, setCrop] = useState({ x: 50, y: 50 });

  const choose = (next?: File) => {
    if (!next) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setCrop({ x: 50, y: 50 });
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!preview || generating) return;
    dragRef.current = { x: event.clientX, y: event.clientY, cropX: crop.x, cropY: crop.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    const stage = stageRef.current;
    if (!start || !stage) return;
    const bounds = stage.getBoundingClientRect();
    setCrop({
      x: Math.max(0, Math.min(100, start.cropX - (event.clientX - start.x) / bounds.width * 100)),
      y: Math.max(0, Math.min(100, start.cropY - (event.clientY - start.y) / bounds.height * 100))
    });
  };

  return (
    <section className="setup-view" aria-label="Create a portrait puzzle">
      <button className="round-button setup-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
      <div className="setup-copy">
        <h1>MAKE IT<br />A PUZZLE</h1>
        <p>Your portrait stays on this device.</p>
      </div>
      <div ref={stageRef} className={`photo-stage ${preview ? 'has-photo' : ''}`} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={() => { dragRef.current = undefined; }}>
        {preview ? <>
          <img src={preview} alt="Selected portrait" style={{ objectPosition: `${crop.x}% ${crop.y}%` }} draggable={false} />
          <span className="frame-hint">DRAG TO FRAME</span>
          <button className="change-photo" onPointerDown={(event) => event.stopPropagation()} onClick={() => inputRef.current?.click()} disabled={generating}>CHANGE</button>
        </> : <button className="choose-photo" onClick={() => inputRef.current?.click()} disabled={generating}><UploadIcon /><span>CHOOSE PORTRAIT</span></button>}
      </div>
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" onChange={(event) => choose(event.target.files?.[0])} />
      {generating ? (
        <div className="generation-progress" aria-live="polite">
          <span>{progressLabel.toUpperCase()}</span>
          <div><i style={{ width: `${progress * 100}%` }} /></div>
        </div>
      ) : (
        <button className="generate-button" disabled={!file} onClick={() => file && onGenerate(file, crop)}>GENERATE PUZZLE</button>
      )}
      <p className="privacy-note">No upload. No account. The original image is never saved.</p>
    </section>
  );
}
