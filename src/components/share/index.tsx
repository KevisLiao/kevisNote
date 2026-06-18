import { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import './index.css';

export interface ShareLabels {
  /** Section label, e.g. "分享" / "Share" */
  label: string;
  /** Copy-link button label */
  copyLink: string;
  /** Feedback shown after the link is copied */
  copied: string;
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
  className?: string;
}

interface ShareTarget {
  name: string;
  label: string;
  href: string;
}

const actionClass =
  'flex h-9 w-9 items-center justify-center rounded-full text-slate10 transition-all hover:bg-slate3 hover:text-slate12';

function ShareIcon({ name }: { name: string }) {
  return <span className={classNames('sb-share-icon', name)} aria-hidden="true" />;
}

function Share({ title, url, labels, className }: ShareProps) {
  const [shareUrl, setShareUrl] = useState(url);
  const [copied, setCopied] = useState(false);

  // Prefer the live browser URL once mounted; keeps SSR markup stable to avoid
  // hydration mismatches.
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

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
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; fail silently.
    }
  }, [shareUrl]);

  return (
    <section
      className={classNames('flex flex-wrap items-center gap-3', className)}
    >
      <span className="text-sm text-slate10">{labels.label}</span>
      <div className="flex items-center gap-1">
        <span className="relative">
          <button
            type="button"
            className={actionClass}
            onClick={handleCopy}
            aria-label={copied ? labels.copied : labels.copyLink}
            title={copied ? labels.copied : labels.copyLink}
          >
            <ShareIcon name="link" />
          </button>
          {copied && (
            <span
              role="status"
              className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate12 px-2 py-1 text-xs text-slate1"
            >
              {labels.copied}
            </span>
          )}
        </span>
        {targets.map((target) => (
          <a
            key={target.name}
            className={actionClass}
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
    </section>
  );
}

export default Share;
