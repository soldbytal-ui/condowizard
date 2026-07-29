import type { TableAlign } from '@/lib/blog-content';

interface Props {
  caption?: string;
  headers: string[];
  align?: TableAlign[];
  rows: string[][];
  totals?: string[][];
}

function alignClass(a?: TableAlign) {
  if (a === 'right') return 'text-right tabular-nums';
  if (a === 'center') return 'text-center';
  return 'text-left';
}

export default function DataTable({ caption, headers, align = [], rows, totals = [] }: Props) {
  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          <thead>
            <tr className="bg-surface2 text-text-primary">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`${alignClass(align[i])} px-4 py-3 font-semibold text-[13px] uppercase tracking-wider`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-text-primary">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-t border-border">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`${alignClass(align[cIdx])} px-4 py-3 leading-relaxed`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {totals.length > 0 && (
            <tfoot className="bg-surface2/60 font-semibold text-text-primary">
              {totals.map((row, rIdx) => {
                const isFinal = rIdx === totals.length - 1;
                return (
                  <tr
                    key={rIdx}
                    className={`border-t border-border ${isFinal ? 'bg-accent-blue/[0.06]' : ''}`}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`${alignClass(align[cIdx])} px-4 py-3 ${isFinal ? 'text-accent-blue' : ''}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tfoot>
          )}
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-text-muted">{caption}</figcaption>
      )}
    </figure>
  );
}
