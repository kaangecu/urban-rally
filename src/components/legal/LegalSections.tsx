/**
 * Renders the numbered sections of a legal text in one language.
 * Text colours follow the modal panel (white, or gray-900 in dark mode).
 */

export type LegalItem = string | { term: string; text: string };

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  intro?: string;
  items?: LegalItem[];
  subsections?: { title: string; items: LegalItem[] }[];
  box?: { lines: string[]; link?: { href: string; label: string } };
  note?: LegalItem;
  contact?: string[];
}

function Item({ item }: { item: LegalItem }) {
  if (typeof item === 'string') return <>{item}</>;
  return (
    <>
      <strong className="text-gray-900 dark:text-white">{item.term}:</strong> {item.text}
    </>
  );
}

function ItemList({ items }: { items: LegalItem[] }) {
  return (
    <ul className="list-disc pl-6 mt-2 space-y-1">
      {items.map((item, i) => (
        <li key={i}><Item item={item} /></li>
      ))}
    </ul>
  );
}

export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.title} className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{s.title}</h2>
          {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
          {s.intro && <p className="font-medium mb-2">{s.intro}</p>}
          {s.items && <ItemList items={s.items} />}
          {s.subsections?.map((sub) => (
            <div key={sub.title}>
              <h3 className="font-semibold mt-4 mb-2 text-gray-900 dark:text-white">{sub.title}</h3>
              <ItemList items={sub.items} />
            </div>
          ))}
          {s.box && (
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm">
              {s.box.lines.map((line) => <p key={line}>{line}</p>)}
              {s.box.link && (
                <a href={s.box.link.href} className="text-blue-700 dark:text-blue-300 underline">{s.box.link.label}</a>
              )}
            </div>
          )}
          {s.note && (
            <p className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 border-l-4 border-yellow-500">
              <Item item={s.note} />
            </p>
          )}
          {s.contact && (
            <p className="mt-2 font-mono text-sm text-blue-700 dark:text-blue-300">
              {s.contact.map((line) => <span key={line} className="block">{line}</span>)}
            </p>
          )}
        </section>
      ))}
    </>
  );
}
