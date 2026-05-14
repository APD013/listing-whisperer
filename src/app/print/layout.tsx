export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          background: #f8fafb !important;
          color: #1a1a2e !important;
        }
        :root, [data-theme], [data-theme="dark"], [data-theme="light"] {
          --lw-bg: #f8fafb !important;
          --lw-card: #ffffff !important;
          --lw-border: #e2e8f0 !important;
          --lw-text: #1a1a2e !important;
          --lw-text-muted: #718096 !important;
          --lw-input: #f0f4f8 !important;
        }
        [data-global-chat],
        [id*="global-chat"],
        [id*="globalchat"],
        [class*="GlobalChat"],
        button[style*="position: fixed"],
        div[style*="position: fixed; bottom"] {
          display: none !important;
        }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          [style*="position: fixed"], [style*="position:fixed"] { display: none !important; }
          .no-print { display: none !important; }
          @page { margin: 12mm; size: letter portrait; }
        }
      `}</style>
      {children}
    </>
  )
}
