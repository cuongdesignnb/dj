import { escapeHtml, headerText } from './smtp-config';

// Plain, email-client-safe layout: inline styles, one table, no images.
// Every value is escaped; visitors fill most of them.

export interface EmailLayout {
  siteName: string;
  heading: string;
  intro?: string;
  rows?: Array<[label: string, value: string | number | null | undefined]>;
  /** Free text from the visitor, shown as a quoted block. */
  message?: { label: string; body: string } | null;
  cta?: { label: string; href: string } | null;
  footer?: string;
}

function present(rows: EmailLayout['rows']) {
  return (rows ?? []).filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '').map(([label, value]) => [label, String(value)] as const);
}

export function renderEmail(layout: EmailLayout): { text: string; html: string } {
  const rows = present(layout.rows);
  const text = [
    layout.heading,
    '',
    ...(layout.intro ? [layout.intro, ''] : []),
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(layout.message ? ['', `${layout.message.label}:`, layout.message.body] : []),
    ...(layout.cta ? ['', `${layout.cta.label}: ${layout.cta.href}`] : []),
    '',
    '—',
    layout.footer ?? layout.siteName,
  ].join('\n');

  const cell = 'padding:8px 0;border-bottom:1px solid #E1E8EF;font-size:14px;line-height:1.5;vertical-align:top;';
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#EEF3F7;font-family:Arial,Helvetica,sans-serif;color:#0B1A24;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF3F7;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:6px;overflow:hidden;">
<tr><td style="background:#00090E;padding:18px 24px;border-bottom:3px solid #04B8FC;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#F5FAFF;font-weight:bold;">${escapeHtml(layout.siteName)}</td></tr>
<tr><td style="padding:24px;">
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#00090E;">${escapeHtml(layout.heading)}</h1>
${layout.intro ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#33475A;">${escapeHtml(layout.intro)}</p>` : ''}
${rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.map(([label, value]) => `<tr><td style="${cell}width:38%;color:#5B6E80;">${escapeHtml(label)}</td><td style="${cell}font-weight:bold;">${escapeHtml(value)}</td></tr>`).join('')}</table>` : ''}
${layout.message ? `<p style="margin:20px 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#5B6E80;">${escapeHtml(layout.message.label)}</p><div style="white-space:pre-wrap;font-size:14px;line-height:1.6;background:#F4F8FB;border-left:3px solid #04B8FC;padding:12px 14px;">${escapeHtml(layout.message.body)}</div>` : ''}
${layout.cta ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(layout.cta.href)}" style="display:inline-block;background:#04B8FC;color:#00131D;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 20px;border-radius:6px;">${escapeHtml(layout.cta.label)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:14px 24px;background:#F4F8FB;font-size:12px;color:#5B6E80;">${escapeHtml(layout.footer ?? layout.siteName)}</td></tr>
</table></td></tr></table></body></html>`;
  return { text, html };
}

/** Subject lines carry visitor-typed names: one line, bounded. */
export function subject(...parts: Array<string | null | undefined>) {
  return headerText(parts.filter(Boolean).join(' — '));
}
