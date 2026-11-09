/// <reference lib="webworker" />
import { generatePuzzle } from './generator';
import type { WorkerRequest, WorkerResponse } from '../types';

const send = (message: WorkerResponse) => self.postMessage(message);

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    send({ type: 'progress', progress: 0.18, label: 'Reading color' });
    const { source, options } = event.data;
    send({ type: 'progress', progress: 0.56, label: 'Drawing paths' });
    const puzzle = generatePuzzle(source, options);
    send({ type: 'progress', progress: 0.88, label: 'Checking exits' });
    send({ type: 'complete', puzzle });
  } catch (error) {
    send({ type: 'error', message: error instanceof Error ? error.message : 'Could not create this puzzle.' });
  }
};

export {};
