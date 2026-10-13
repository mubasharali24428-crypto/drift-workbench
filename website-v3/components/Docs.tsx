import { CommandBar } from "@/components/CommandBar";
import { DOCS, TOOLS, type DocLine } from "@/content/copy";
import { SITE } from "@/lib/site";

// Derived from the one install command, so the docs cannot drift from the homepage.
const [COMMAND, ...ARGS] = SITE.installCommand.split(" ");
const CLAUDE_CODE = `claude mcp add drift-workbench -- ${SITE.installCommand}`;
// Written out so `args` stays on one line and a narrow screen wraps at a space, not mid-token.
const CONFIG = `{
  "mcpServers": {
    "drift-workbench": {
      "command": "${COMMAND}",
      "args": [${ARGS.map((a) => `"${a}"`).join(", ")}]
    }
  }
}`;

const CARD = "scroll-mt-20 rounded-md border border-border bg-card p-6 sm:p-8";
const P = "mt-4 text-body text-muted-foreground";
const LINK =
  "whitespace-nowrap text-foreground underline decoration-border-strong underline-offset-4 transition-colors duration-180 hover:decoration-foreground";

// Backticks in copy mark inline code.
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 ? (
          <code key={i} className="font-mono text-mono text-foreground">
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

function List({ items, ordered }: { items: readonly DocLine[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`${P} space-y-2 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((item) => (
        <li key={item.text}>
          <Rich text={item.text} />
          {item.link && (
            <>
              {" "}
              <a href={item.link.href} className={LINK}>
                {item.link.label}
              </a>
            </>
          )}
        </li>
      ))}
    </Tag>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 whitespace-pre-wrap break-words rounded-md border border-border bg-background p-4 font-mono text-mono-sm text-foreground sm:text-mono">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={CARD}>
      <h2 className="font-display text-heading font-semibold">{heading}</h2>
      {children}
    </section>
  );
}

export function Docs() {
  const { install, firstRun, tools } = DOCS;
  const listSections = [
    { id: "desktop", ...DOCS.desktop },
    { id: "limits", ...DOCS.limits },
    { id: "privacy", ...DOCS.privacy },
    { id: "troubleshooting", ...DOCS.help },
  ];
  return (
    <>
      <header className="px-4 pb-10 pt-20 text-center sm:px-6 md:pt-32">
        <h1 className="mx-auto max-w-3xl font-display text-display-md font-semibold">
          {DOCS.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-prose text-body-lg text-muted-foreground">{DOCS.sub}</p>
        <div className="mt-10">
          <CommandBar />
        </div>
        <p className="mt-4 text-small text-muted-foreground">{install.run}</p>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-20 sm:px-6 md:pb-32">
        <Section id="install" heading={install.heading}>
          <List items={install.needs} />
          <p className={P}>{install.claudeCode}</p>
          <Code>{CLAUDE_CODE}</Code>
          <p className={P}>
            <Rich text={install.config} />
          </p>
          <Code>{CONFIG}</Code>
          <p className={P}>{install.restart}</p>
        </Section>
        <Section id="first-run" heading={firstRun.heading}>
          <List items={firstRun.steps} ordered />
        </Section>
        <Section id="tool-list" heading={tools.heading}>
          <p className={P}>{tools.intro}</p>
          <dl className="mt-4">
            {TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="grid gap-1 border-t border-border py-3 sm:grid-cols-3"
              >
                <dt>
                  <code className="break-all font-mono text-mono text-foreground">{tool.name}</code>
                </dt>
                <dd className="text-small text-muted-foreground sm:col-span-2">
                  {tool.description}
                </dd>
              </div>
            ))}
          </dl>
          <p className={P}>
            <Rich text={tools.drift} />
          </p>
        </Section>
        {listSections.map(({ id, heading, items }) => (
          <Section key={id} id={id} heading={heading}>
            <List items={items} />
          </Section>
        ))}
      </div>
    </>
  );
}
