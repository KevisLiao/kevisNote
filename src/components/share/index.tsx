import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import './index.css';

export interface ShareLabels {
  /** Accessible section label, e.g. "分享" / "Share" */
  label: string;
  /** Bookmark button label */
  bookmark: string;
  /** Desktop bookmark instructions, with a {{shortcut}} placeholder */
  bookmarkHint: string;
  /** Mobile bookmark instructions */
  bookmarkMobileHint: string;
  /** Copy-link button label */
  copyLink: string;
  /** Feedback shown after the link is copied */
  copied: string;
  copying: string;
  copyFailed: string;
  /** aria-label for sharing to X */
  x: string;
  /** aria-label for sharing to Facebook */
  facebook: string;
  /** aria-label for sharing to LinkedIn */
  linkedin: string;
  /** aria-label for sharing to Threads */
  threads: string;
  /** aria-label for sharing via email */
  mail: string;
}

export interface ShareProps {
  /** Article title, used as the share text */
  title: string;
  /** Canonical article URL (SSR fallback; the live URL is used on the client) */
  url: string;
  /** Localized labels */
  labels: ShareLabels;
  /** Show the visible section label (used by the bottom toolbar) */
  showLabel?: boolean;
  className?: string;
}

interface ShareTarget {
  name: string;
  label: string;
  href: string;
}

interface Feedback {
  kind: 'bookmark' | 'copying' | 'copied' | 'copyError';
  message: string;
}

function ShareIcon({ name }: { name: string }) {
  return <span className={classNames('sb-share-icon', name)} aria-hidden="true" />;
}

function Share({ title, url, labels, showLabel = true, className }: ShareProps) {
  const [shareUrl, setShareUrl] = useState(url);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const manualCopyRef = useRef<HTMLInputElement>(null);
  const tooltipId = useId();
  const bookmarkTooltipId = `${tooltipId}-bookmark`;
  const copyTooltipId = `${tooltipId}-copy`;
  const bookmarkOpen = feedback?.kind === 'bookmark';
  const copyOpen = Boolean(feedback && !bookmarkOpen);

  // Prefer the live browser URL once mounted; keeps SSR markup stable to avoid
  // hydration mismatches.
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!feedback) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) {
        setFeedback(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFeedback(null);
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [feedback]);

  useEffect(() => {
    if (feedback?.kind !== 'copied') return;
    const timeout = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (feedback?.kind === 'copyError') {
      manualCopyRef.current?.focus();
      manualCopyRef.current?.select();
    }
  }, [feedback]);

  const handleBookmark = useCallback(() => {
    const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent);
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (isMac && navigator.maxTouchPoints > 1);
    const hint = isMobile
      ? labels.bookmarkMobileHint
      : labels.bookmarkHint.replace('{{shortcut}}', isMac ? '⌘ + D' : 'Ctrl + D');
    setFeedback((current) =>
      current?.kind === 'bookmark' ? null : { kind: 'bookmark', message: hint },
    );
  }, [labels]);

  const targets = useMemo<ShareTarget[]>(() => {
    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(title);

    return [
      {
        name: 'x',
        label: labels.x,
        href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      },
      {
        name: 'facebook',
        label: labels.facebook,
        href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      },
      {
        name: 'in',
        label: labels.linkedin,
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      },
      {
        name: 'threads',
        label: labels.threads,
        href: `https://www.threads.net/intent/post?text=${t}%20${u}`,
      },
      {
        name: 'mail',
        label: labels.mail,
        href: `mailto:?subject=${t}&body=${u}`,
      },
    ];
  }, [shareUrl, title, labels]);

  const handleCopy = useCallback(async () => {
    setFeedback({ kind: 'copying', message: labels.copying });
    let didCopy = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        didCopy = true;
      }
    } catch {
      // Try the selection-based fallback if clipboard permission is denied.
    }

    if (!didCopy) {
      const focusedElement = document.activeElement;
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.readOnly = true;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      try {
        textarea.select();
        didCopy = document.execCommand('copy');
      } catch {
        didCopy = false;
      } finally {
        textarea.remove();
        if (focusedElement instanceof HTMLElement) {
          focusedElement.focus({ preventScroll: true });
        }
      }
    }

    setFeedback((current) =>
      current?.kind === 'copying'
        ? {
            kind: didCopy ? 'copied' : 'copyError',
            message: didCopy ? labels.copied : labels.copyFailed,
          }
        : current,
    );
  }, [shareUrl, labels]);

  return (
    <section
      aria-label={labels.label}
      className={classNames('sb-share heti-skip', className)}
    >
      {showLabel && <span className="sb-share-label">{labels.label}</span>}
      <div className="sb-share-groups">
        <div className="sb-share-personal" ref={actionsRef}>
          <div className="sb-share-control">
            <button
              type="button"
              className="sb-share-action"
              onClick={handleBookmark}
              aria-label={labels.bookmark}
              aria-describedby={bookmarkTooltipId}
              aria-expanded={bookmarkOpen}
            >
              <ShareIcon name="bookmark" />
            </button>
            <span
              id={bookmarkTooltipId}
              role={bookmarkOpen ? 'status' : 'tooltip'}
              className={classNames('sb-share-tooltip', {
                'sb-share-hover-hint': !bookmarkOpen,
              })}
            >
              {bookmarkOpen ? feedback?.message : labels.bookmark}
            </span>
          </div>
          <div className="sb-share-control">
            <button
              type="button"
              className="sb-share-action"
              onClick={handleCopy}
              disabled={feedback?.kind === 'copying'}
              aria-label={feedback?.kind === 'copied' ? labels.copied : labels.copyLink}
              aria-describedby={copyTooltipId}
            >
              <ShareIcon name="link" />
            </button>
            <span
              id={copyTooltipId}
              role={copyOpen ? 'status' : 'tooltip'}
              className={classNames('sb-share-tooltip', {
                'sb-share-hover-hint': !copyOpen,
              })}
            >
              {copyOpen ? feedback?.message : labels.copyLink}
              {feedback?.kind === 'copyError' && (
                <input
                  ref={manualCopyRef}
                  className="sb-share-manual-copy"
                  aria-label={labels.copyLink}
                  value={shareUrl}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
              )}
            </span>
          </div>
        </div>
        <span className="sb-share-divider" role="separator" aria-orientation="vertical" />
        <div className="sb-share-social">
          {targets.map((target) => (
            <a
              key={target.name}
              className="sb-share-action"
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={target.label}
              title={target.label}
            >
              <ShareIcon name={target.name} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Share;
