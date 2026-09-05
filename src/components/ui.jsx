import { useState } from 'react';
import { statusOrder } from '../copy/index.js';
import { compressImage } from '../lib/photo.js';
import { useInView } from '../lib/useInView.js';
import { useT } from '../store/app.jsx';

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  capsule = false,
  pill = false,
  ...props
}) {
  const styles = {
    primary:
      'bg-primary text-white shadow-pop hover:bg-primary-dark hover:shadow-lift disabled:bg-line disabled:text-mute disabled:shadow-none',
    ghost: 'bg-white text-ink border border-line hover:border-primary hover:bg-primary-soft/50',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300',
    fresh: 'bg-fresh text-white hover:bg-fresh-dark',
  };
  const round = capsule || pill ? 'rounded-full' : 'rounded-cut';
  return (
    <button
      type={type}
      className={`min-h-11 w-full px-4 py-3 text-[15px] font-bold transition duration-200 active:scale-[0.99] ${
        capsule ? 'flex items-center justify-between gap-3 pl-5 pr-1.5' : ''
      } ${round} ${styles[variant]} ${className}`}
      {...props}
    >
      {capsule ? (
        <>
          <span className="text-left leading-snug">{children}</span>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-base leading-none transition group-hover:translate-x-0.5">
            →
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function Reveal({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

export function Chip({ active, children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 max-w-full items-center whitespace-normal rounded-full px-4 py-2 text-left text-sm font-semibold leading-snug transition duration-200 ${
        active
          ? 'bg-ink text-white'
          : 'border border-line bg-white text-ink hover:border-primary hover:bg-primary-soft/70'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function ChipRow({ children }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function EmptyState({ title, action, onAction }) {
  return (
    <div className="rounded-cut border border-dashed border-line bg-white/70 px-5 py-10 text-center">
      <p className="text-mute">{title}</p>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 font-bold text-primary transition hover:text-primary-dark"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function StatusChip({ status }) {
  const t = useT();
  const map = {
    accepted: 'bg-primary-soft text-primary-dark',
    baking: 'bg-amber-100 text-amber-800',
    ready: 'bg-fresh-soft text-fresh-dark',
    delivered: 'bg-stone-200 text-ink',
    cancelled: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[status] || 'bg-stone-100'}`}>
      {t(`status.${status}`) || status}
    </span>
  );
}

const stepperFill = {
  accepted: 'bg-primary',
  baking: 'bg-amber-400',
  ready: 'bg-fresh',
  delivered: 'bg-fresh',
};

export function StatusStepper({ status }) {
  const t = useT();
  const current = statusOrder.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {statusOrder.map((key, i) => {
        const done = current >= i && status !== 'cancelled';
        const color = stepperFill[key] || 'bg-primary';
        return (
          <div key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${done ? color : 'bg-transparent'}`}
                style={{ width: done ? '100%' : '0%' }}
              />
            </div>
            <span className={`text-[10px] font-semibold ${done ? 'text-ink' : 'text-mute'}`}>
              {t(`status.${key}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] w-[min(92%,420px)] -translate-x-1/2">
      <div className="rounded-cut bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-card">
        {message}
      </div>
    </div>
  );
}

export function Modal({ open, title, children, onClose }) {
  const t = useT();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t('cancel')} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-card sm:rounded-cut">
        {title && <h3 className="mb-3 text-lg font-extrabold">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-mute">{label}</span>
      {children}
    </label>
  );
}

export function inputClass(error) {
  return `min-h-11 w-full rounded-cut border bg-white px-4 py-3 outline-none transition duration-200 ${
    error ? 'border-red-400' : 'border-line focus:border-primary hover:border-primary/70'
  }`;
}

function EyeOpenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9s3.5 6 9 6 9-6 9-6" />
      <path d="M10.5 14.5 9 18" />
      <path d="M13.5 14.5 15 18" />
      <path d="M7 13 5 16.5" />
      <path d="M17 13l2 3.5" />
    </svg>
  );
}

export function PasswordInput({ className = '', ...props }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`min-h-11 w-full rounded-cut border border-line bg-white py-3 pl-4 pr-12 outline-none transition duration-200 hover:border-primary/70 focus:border-primary ${className}`}
      />
      <button
        type="button"
        className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-cut text-mute transition hover:bg-cream hover:text-ink"
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </div>
  );
}

export function FoodStage({
  photoUrl,
  emoji = '🥐',
  accent = '#E85D04',
  ratio = 'plate',
  dim = false,
  className = '',
}) {
  const box =
    ratio === 'poster'
      ? 'aspect-[16/10]'
      : ratio === 'thumb'
        ? 'h-16 w-16 shrink-0'
        : ratio === 'hero'
          ? 'min-h-[220px] aspect-[16/10] sm:min-h-[280px]'
          : 'aspect-[4/3]';
  return (
    <div
      className={`img-zoom-wrap relative overflow-hidden ${box} ${className}`}
      style={{
        background: photoUrl
          ? '#1c1917'
          : `linear-gradient(160deg, ${accent}40 0%, #fff3e8 48%, #f6e4d4 100%)`,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className={`img-zoom h-full w-full object-cover ${dim ? 'grayscale contrast-75' : ''}`}
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center select-none ${
            ratio === 'thumb' ? 'text-3xl' : 'text-6xl sm:text-7xl'
          }`}
          aria-hidden="true"
        >
          {emoji}
        </span>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-white/10" />
    </div>
  );
}

export function FoodTile({ emoji, accent, className = '' }) {
  return <FoodStage emoji={emoji} accent={accent} ratio="thumb" className={className} />;
}

export function KitchenCard({ kitchen, meta, onClick }) {
  return (
    <button type="button" onClick={onClick} className="card-cut hover-lift hover-cut group w-full text-left">
      <FoodStage photoUrl={kitchen.photoUrl} emoji={kitchen.emoji || '🥐'} accent={kitchen.accent} ratio="poster" />
      <div className="border-t border-ink/10 bg-white px-4 py-3">
        <p className="font-extrabold tracking-tight">{kitchen.name}</p>
        {meta ? (
          <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.14em] text-mute">{meta}</p>
        ) : null}
      </div>
    </button>
  );
}

export function EmojiPicker({ label, value, onChange, options }) {
  return (
    <div>
      {label ? <p className="mb-1.5 text-sm font-semibold text-mute">{label}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((emo) => (
          <button
            key={emo}
            type="button"
            onClick={() => onChange(emo)}
            className={`grid h-11 w-11 place-items-center rounded-cut text-xl transition duration-200 hover:scale-110 ${
              value === emo ? 'bg-ink text-white shadow-cut' : 'border border-line bg-white hover:border-primary'
            }`}
          >
            {emo}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PhotoField({ label, hint, removeLabel, value, onChange, onError }) {
  const [busy, setBusy] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const data = await compressImage(file);
      onChange(data);
    } catch {
      onError?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-mute">{label}</span>
      {value ? (
        <div className="card-cut mb-2 overflow-hidden">
          <img src={value} alt="" className="aspect-[16/10] w-full object-cover" />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-cut border border-line bg-white px-4 text-sm font-bold transition duration-200 hover:border-primary hover:bg-primary-soft/50">
          {busy ? '…' : label}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        </label>
        {value ? (
          <button
            type="button"
            className="min-h-11 rounded-cut border border-line px-4 text-sm font-bold transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            onClick={() => onChange('')}
          >
            {removeLabel}
          </button>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}
