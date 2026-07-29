import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import type { Block } from '@/lib/blog-content';
import { slugifyHeading } from '@/lib/blog-content';
import { Takeaways, Warning, Checklist, ExampleAssumptions } from './Callouts';
import DataTable from './DataTable';
import TimelineBlock from './TimelineBlock';
import TalTake from './TalTake';
import CtaBlock from './CtaBlock';
import FaqBlock from './FaqBlock';
import SourcesBlock from './SourcesBlock';

interface Props {
  blocks: Block[];
  accessDate: string;
}

// Minimal markdown renderer that produces the buyer-guide typography rules
// without depending on the tailwind typography plugin (not installed).
function ArticleMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children: c }) => {
          const text = flattenText(c);
          const id = slugifyHeading(text);
          return (
            <h2
              id={id}
              className="scroll-mt-28 mt-14 mb-5 pb-3 border-b border-border font-serif text-[26px] md:text-[28px] font-bold tracking-tight text-text-primary"
            >
              {c}
            </h2>
          );
        },
        h3: ({ children: c }) => {
          const text = flattenText(c);
          const id = slugifyHeading(text);
          return (
            <h3
              id={id}
              className="scroll-mt-28 mt-8 mb-3 text-[20px] font-semibold tracking-tight text-text-primary"
            >
              {c}
            </h3>
          );
        },
        p: ({ children: c }) => (
          <p className="mb-5 text-[16.5px] md:text-[17px] leading-[1.75] text-text-primary/90">
            {c}
          </p>
        ),
        ul: ({ children: c }) => (
          <ul className="mb-5 space-y-2 list-disc pl-6 text-[16px] text-text-primary/90 marker:text-accent-blue/50">
            {c}
          </ul>
        ),
        ol: ({ children: c }) => (
          <ol className="mb-5 space-y-2 list-decimal pl-6 text-[16px] text-text-primary/90 marker:text-accent-blue/70">
            {c}
          </ol>
        ),
        li: ({ children: c }) => <li className="leading-[1.7]">{c}</li>,
        strong: ({ children: c }) => (
          <strong className="font-semibold text-text-primary">{c}</strong>
        ),
        em: ({ children: c }) => <em className="italic text-text-primary/90">{c}</em>,
        blockquote: ({ children: c }) => (
          <blockquote className="my-6 border-l-2 border-accent-blue/50 pl-5 italic text-text-primary/80">
            {c}
          </blockquote>
        ),
        code: ({ children: c }) => (
          <code className="rounded bg-surface2 px-1.5 py-0.5 text-[14px] text-accent-blue">
            {c}
          </code>
        ),
        hr: () => <hr className="my-10 border-border" />,
        a: ({ href, children: c }) => {
          if (!href) return <>{c}</>;
          if (href.startsWith('/') || href.startsWith('#')) {
            return (
              <Link href={href} className="text-accent-blue font-medium hover:underline">
                {c}
              </Link>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-blue font-medium hover:underline"
            >
              {c}
            </a>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function flattenText(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return flattenText((node as any).props.children);
  }
  return '';
}

export default function ArticleBody({ blocks, accessDate }: Props) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'markdown':
            return <ArticleMarkdown key={i}>{block.value}</ArticleMarkdown>;
          case 'takeaways':
            return <Takeaways key={i} items={block.items} />;
          case 'warning':
            return <Warning key={i} value={block.value} />;
          case 'checklist':
            return <Checklist key={i} items={block.items} />;
          case 'example':
            return (
              <ExampleAssumptions key={i} title={block.title} assumptions={block.assumptions} />
            );
          case 'table':
            return (
              <DataTable
                key={i}
                caption={block.caption}
                headers={block.headers}
                align={block.align}
                rows={block.rows}
                totals={block.totals}
              />
            );
          case 'timeline':
            return <TimelineBlock key={i} stages={block.stages} />;
          case 'taltake':
            return <TalTake key={i} value={block.value} />;
          case 'cta':
            return (
              <CtaBlock
                key={i}
                kind={block.kind}
                heading={block.heading}
                body={block.body}
                buttons={block.buttons}
              />
            );
          case 'faq':
            return <FaqBlock key={i} items={block.items} />;
          case 'sources':
            return <SourcesBlock key={i} items={block.items} accessDate={accessDate} />;
          default:
            return null;
        }
      })}
    </>
  );
}
