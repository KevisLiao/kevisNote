import { useEffect, useMemo, useRef, useState } from 'react';

type Order = 'desc' | 'asc';

export interface PostItem {
  title: string;
  url: string;
  /** Pre-formatted, locale-aware date string for display */
  date: string;
  /** pubDate timestamp (ms) for sorting */
  time: number;
}

interface Props {
  posts: PostItem[];
  labels: {
    /** aria label for the sort control */
    sort: string;
    /** descending = newest first (default) */
    desc: string;
    /** ascending = oldest first */
    asc: string;
  };
}

// Lucide-style sort glyph: a directional arrow plus graduated bars.
// Flips with the order — down/wide→narrow for desc, up/narrow→wide for asc.
const SortIcon = ({ order }: { order: Order }) => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {order === 'desc' ? (
      <>
        <path d="m3 16 4 4 4-4" />
        <path d="M7 20V4" />
        <path d="M11 4h10" />
        <path d="M11 8h7" />
        <path d="M11 12h4" />
      </>
    ) : (
      <>
        <path d="m3 8 4-4 4 4" />
        <path d="M7 4v16" />
        <path d="M11 12h4" />
        <path d="M11 16h7" />
        <path d="M11 20h10" />
      </>
    )}
  </svg>
);

const PostList = ({ posts, labels }: Props) => {
  const [order, setOrder] = useState<Order>('desc');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => (order === 'desc' ? b.time - a.time : a.time - b.time)),
    [posts, order],
  );

  const options: { value: Order; label: string }[] = [
    { value: 'desc', label: labels.desc },
    { value: 'asc', label: labels.asc },
  ];

  const select = (value: Order) => {
    setOrder(value);
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end" ref={ref}>
        <div className="relative">
          <button
            type="button"
            className="text-slate10 hover:bg-slate3 hover:text-slate11 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={labels.sort}
            onClick={() => setOpen((o) => !o)}
          >
            <SortIcon order={order} />
            <span>{order === 'desc' ? labels.desc : labels.asc}</span>
          </button>

          {open && (
            <ul
              role="listbox"
              aria-label={labels.sort}
              className="border-slate4 bg-slate1 absolute right-0 z-10 mt-1 min-w-[7rem] overflow-hidden rounded-md border py-1 shadow-md"
            >
              {options.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={order === opt.value}
                  tabIndex={0}
                  className={`hover:bg-slate3 cursor-pointer px-3 py-1.5 text-sm transition-colors ${order === opt.value ? 'text-slate12' : 'text-slate10'}`}
                  onClick={() => select(opt.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      select(opt.value);
                    }
                  }}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="text-slate12 text-base">
        {sorted.map((item) => (
          <a
            key={item.url}
            className="active:bg-slate4 sm:hover:bg-slate3 flex cursor-pointer flex-col gap-1 rounded-lg py-2.5 transition-all active:scale-[0.995] sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-6 sm:px-2"
            href={item.url}
            title={item.title}
          >
            <span className="min-w-0">{item.title}</span>
            <span className="text-slate8 shrink-0 whitespace-nowrap">{item.date}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default PostList;
