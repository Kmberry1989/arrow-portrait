import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { BackIcon, BulbIcon, PauseIcon, RestartIcon, UndoIcon } from './components/Icons';
import { SetupView } from './components/SetupView';
import { haptic, playBlocked, playMove, playWin } from './game/audio';
import { canExit } from './game/geometry';
import { generatePuzzle } from './game/generator';
import { loadPuzzle, savePuzzle } from './game/storage';
import type { PixelSource, PieceSpec, PuzzleSpec, WorkerResponse } from './types';

interface FlyingPiece { id: number; progress: number }

const createPixelSource = async (file: File, crop: { x: number; y: number }): Promise<{ source: PixelSource; preview: string }> => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = 350;
  canvas.height = 520;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Image processing is unavailable in this browser.');
  const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  const offsetX = -(width - canvas.width) * crop.x / 100;
  const offsetY = -(height - canvas.height) * crop.y / 100;
  context.drawImage(bitmap, offsetX, offsetY, width, height);
  bitmap.close();
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return {
    source: { width: canvas.width, height: canvas.height, pixels: image.data },
    preview: canvas.toDataURL('image/jpeg', 0.72)
  };
};

export default function App() {
  const [puzzle, setPuzzle] = useState<PuzzleSpec>(() => generatePuzzle());
  const [removed, setRemoved] = useState<Set<number>>(() => new Set());
  const [history, setHistory] = useState<number[]>([]);
  const [flying, setFlying] = useState<FlyingPiece>();
  const [blockedId, setBlockedId] = useState<number>();
  const [hintId, setHintId] = useState<number>();
  const [paused, setPaused] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationLabel, setGenerationLabel] = useState('Preparing');
  const hasCelebrated = useRef(false);

  useEffect(() => {
    loadPuzzle().then((stored) => {
      if (stored?.version === 1 && stored.pieces.length === 146) setPuzzle(stored);
    }).catch(() => undefined);
  }, []);

  const activePieces = useMemo(() => puzzle.pieces.filter((piece) => !removed.has(piece.id)), [puzzle, removed]);
  const complete = removed.size === puzzle.pieces.length;

  useEffect(() => {
    if (complete && !hasCelebrated.current) {
      hasCelebrated.current = true;
      playWin();
      haptic([35, 45, 70]);
    }
    if (!complete) hasCelebrated.current = false;
  }, [complete]);

  const removePiece = useCallback((piece: PieceSpec) => {
    const started = performance.now();
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 360;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      setFlying({ id: piece.id, progress });
      if (progress < 1) requestAnimationFrame(animate);
      else {
        setRemoved((current) => new Set(current).add(piece.id));
        setHistory((current) => [...current, piece.id]);
        setFlying(undefined);
      }
    };
    requestAnimationFrame(animate);
    playMove();
    haptic(18);
  }, []);

  const handlePiecePress = useCallback((piece: PieceSpec) => {
    setHintId(undefined);
    if (canExit(piece, activePieces, puzzle.width, puzzle.height)) {
      removePiece(piece);
    } else {
      setBlockedId(piece.id);
      window.setTimeout(() => setBlockedId((current) => current === piece.id ? undefined : current), 380);
      playBlocked();
      haptic([12, 35, 12]);
    }
  }, [activePieces, puzzle, removePiece]);

  const undo = () => {
    if (flying || history.length === 0) return;
    const id = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    setRemoved((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    haptic(12);
  };

  const restart = () => {
    setRemoved(new Set());
    setHistory([]);
    setHintId(undefined);
    setPaused(false);
  };

  const hint = () => {
    const candidate = activePieces.find((piece) => canExit(piece, activePieces, puzzle.width, puzzle.height));
    if (!candidate) return;
    setHintId(candidate.id);
    window.setTimeout(() => setHintId((current) => current === candidate.id ? undefined : current), 1400);
    haptic(10);
  };

  const generateFromPhoto = async (file: File, crop: { x: number; y: number }) => {
    setGenerating(true);
    setGenerationProgress(0.08);
    setGenerationLabel('Reading portrait');
    try {
      const { source, preview } = await createPixelSource(file, crop);
      const worker = new Worker(new URL('./game/generator.worker.ts', import.meta.url), { type: 'module' });
      const result = await new Promise<PuzzleSpec>((resolve, reject) => {
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const message = event.data;
          if (message.type === 'progress') {
            setGenerationProgress(message.progress);
            setGenerationLabel(message.label);
          } else if (message.type === 'complete') resolve({ ...message.puzzle, preview });
          else reject(new Error(message.message));
        };
        worker.onerror = () => reject(new Error('The puzzle worker stopped unexpectedly.'));
        worker.postMessage({ type: 'generate', source, options: { seed: Date.now() & 0xfffffff, pieceCount: 146, width: 350, height: 520 } });
      });
      worker.terminate();
      setGenerationProgress(1);
      setGenerationLabel('Ready');
      setPuzzle(result);
      setRemoved(new Set());
      setHistory([]);
      await savePuzzle(result).catch(() => undefined);
      window.setTimeout(() => {
        setShowSetup(false);
        setGenerating(false);
      }, 280);
    } catch (error) {
      setGenerationLabel(error instanceof Error ? error.message : 'Could not create this puzzle');
      setGenerationProgress(0);
      setGenerating(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="game-screen">
        <header className="game-header">
          <button className="round-button header-button" onClick={() => setShowSetup(true)} aria-label="Choose a portrait"><BackIcon /></button>
          <div className="level-title">
            <h1>{puzzle.title}</h1>
            <p>{puzzle.subtitle}</p>
          </div>
          <button className="round-button header-button" onClick={() => setPaused(true)} aria-label="Pause"><PauseIcon /></button>
        </header>

        <div className="progress-wrap" aria-label={`${removed.size} of ${puzzle.pieces.length} pieces removed`}>
          <div className="progress-track"><i style={{ width: `${removed.size / puzzle.pieces.length * 100}%` }} /></div>
          <span>{removed.size} / {puzzle.pieces.length}</span>
        </div>

        <section className="board-wrap">
          <GameCanvas puzzle={puzzle} removed={removed} flying={flying} blockedId={blockedId} hintId={hintId} onPiecePress={handlePiecePress} />
        </section>

        <nav className="game-actions" aria-label="Puzzle actions">
          <button onClick={undo} disabled={history.length === 0 || Boolean(flying)}><span><UndoIcon /></span><em>UNDO</em></button>
          <button onClick={hint} disabled={complete || Boolean(flying)}><span><BulbIcon /></span><em>HINT</em></button>
          <button onClick={restart} disabled={removed.size === 0 && !flying}><span><RestartIcon /></span><em>RESTART</em></button>
        </nav>

        {paused && (
          <div className="modal-layer">
            <div className="modal-content">
              <p>PAUSED</p>
              <button className="primary-action" onClick={() => setPaused(false)}>RESUME</button>
              <button className="text-action" onClick={() => { setPaused(false); setShowSetup(true); }}>NEW PORTRAIT</button>
            </div>
          </div>
        )}

        {complete && (
          <div className="modal-layer win-layer">
            {puzzle.preview && <img src={puzzle.preview} alt="Completed portrait" />}
            <div className="modal-content">
              <p>PORTRAIT<br />CLEARED</p>
              <button className="primary-action" onClick={restart}>PLAY AGAIN</button>
              <button className="text-action" onClick={() => setShowSetup(true)}>NEW PORTRAIT</button>
            </div>
          </div>
        )}

        {showSetup && <SetupView onClose={() => !generating && setShowSetup(false)} onGenerate={generateFromPhoto} generating={generating} progress={generationProgress} progressLabel={generationLabel} />}
      </div>
    </main>
  );
}
