import type { SVGProps } from 'react';

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
type IconProps = SVGProps<SVGSVGElement>;

export const BackIcon = (props: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...base} d="M19 12H5m6-6-6 6 6 6" /></svg>;
export const PauseIcon = (props: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...base} d="M9 6v12M15 6v12" /></svg>;
export const UndoIcon = (props: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...base} d="M8 8H3v-5M3.5 8a9 9 0 1 1-.2 7" /></svg>;
export const RestartIcon = (props: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...base} d="M16 8h5V3M20.5 8A9 9 0 1 0 21 15" /></svg>;
export const BulbIcon = (props: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...base} d="M9 18h6m-5 3h4m-7.5-9.5a5.5 5.5 0 1 1 11 0c0 2-1 3.2-2.2 4.4-.7.7-.8 1.1-.8 2.1h-5c0-1-.1-1.4-.8-2.1-1.2-1.2-2.2-2.4-2.2-4.4ZM12 1v2M3.8 4l1.4 1.4M20.2 4l-1.4 1.4M2 12h2M20 12h2" /></svg>;
export const CloseIcon = (props: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...base} d="m6 6 12 12M18 6 6 18" /></svg>;
export const UploadIcon = (props: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...base} d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" /></svg>;
