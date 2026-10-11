'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Bold, Heading3, Italic, Link2, List, ListOrdered, Redo2, Undo2, Unlink } from 'lucide-react';

/**
 * Visual editor for long-form copy. It edits a small Markdown subset that the
 * public site renders with <RichText>: paragraphs, line breaks (Shift+Enter),
 * bold, italic, links, bulleted/numbered lists and small headings. `inline`
 * keeps only bold, italic and links for single paragraphs (news blocks).
 * Plain text written before the editor existed loads unchanged.
 */
export interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (markdown: string) => void;
  mode?: 'full' | 'inline';
  disabled?: boolean;
  invalid?: boolean;
  lang?: string;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const SAFE_LINK = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;

function serialize(editor: Editor): string {
  return editor.isEmpty ? '' : editor.getMarkdown().trim();
}

export function isSafeEditorLink(value: string): boolean {
  return SAFE_LINK.test(value.trim());
}

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[6px] px-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'bg-rave-red/20 text-white' : 'text-admin-muted hover:bg-white/10 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ id, value, onChange, mode = 'full', disabled = false, invalid = false, lang, ariaLabelledBy, ariaLabel, ariaDescribedBy }: RichTextEditorProps) {
  const lastEmitted = useRef(value);
  // The value the editor was loaded with, and its Markdown as the editor writes it.
  // Editor-internal transactions (normalising, trailing paragraphs) must not mark a form dirty.
  const loadedValue = useRef(value);
  const loadedMarkdown = useRef<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const full = mode === 'full';

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: full ? { levels: [3] } : false,
        bulletList: full ? {} : false,
        orderedList: full ? {} : false,
        listItem: full ? {} : false,
        listKeymap: full ? {} : false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['mailto', 'tel'], isAllowedUri: (url) => isSafeEditorLink(url), HTMLAttributes: { rel: null, target: null } },
      }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
        ...(invalid ? { 'aria-invalid': 'true' } : {}),
        ...(lang ? { lang } : {}),
        class: `${full ? 'min-h-32' : 'min-h-20'} max-h-[28rem] overflow-y-auto px-3 py-2 text-sm leading-relaxed text-white focus:outline-none [&_a]:text-white [&_a]:underline [&_a]:decoration-rave-red/70 [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+*]:mt-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_*+p]:mt-2`,
      },
    },
    onCreate: ({ editor: current }) => {
      loadedMarkdown.current = serialize(current);
    },
    onUpdate: ({ editor: current }) => {
      const markdown = serialize(current);
      const next = markdown === loadedMarkdown.current ? loadedValue.current : markdown;
      if (next === lastEmitted.current) return;
      lastEmitted.current = next;
      onChange(next);
    },
  });

  // Follow outside changes (another locale, a reset after save) without echoing them back.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    loadedValue.current = value;
    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false });
    loadedMarkdown.current = serialize(editor);
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive('bold') ?? false,
      italic: current?.isActive('italic') ?? false,
      link: current?.isActive('link') ?? false,
      bullet: current?.isActive('bulletList') ?? false,
      ordered: current?.isActive('orderedList') ?? false,
      heading: current?.isActive('heading', { level: 3 }) ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  });

  const openLink = () => {
    if (!editor) return;
    setLinkValue(String(editor.getAttributes('link').href ?? ''));
    setLinkError(null);
    setLinkOpen(true);
  };
  const applyLink = () => {
    if (!editor) return;
    const href = linkValue.trim();
    if (!href) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkOpen(false); return; }
    if (!isSafeEditorLink(href)) { setLinkError('Use https://, mailto:, tel: or a site path starting with /.'); return; }
    const chain = editor.chain().focus().extendMarkRange('link');
    if (editor.state.selection.empty && !editor.isActive('link')) chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
    else chain.setLink({ href }).run();
    setLinkOpen(false);
  };

  const off = disabled || !editor;
  return (
    <div data-rich-text-editor={mode} className={`rounded-[8px] border bg-admin-deep transition-colors focus-within:border-rave-red focus-within:ring-1 focus-within:ring-rave-red/60 ${invalid ? 'border-rave-red' : 'border-admin-border'} ${disabled ? 'opacity-60' : ''}`}>
      <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-0.5 border-b border-admin-border px-1.5 py-1">
        <ToolButton label="Bold" active={state?.bold} disabled={off} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolButton>
        <ToolButton label="Italic" active={state?.italic} disabled={off} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolButton>
        <ToolButton label="Link" active={state?.link} disabled={off} onClick={openLink}><Link2 className="h-4 w-4" /></ToolButton>
        {state?.link && <ToolButton label="Remove link" disabled={off} onClick={() => editor?.chain().focus().extendMarkRange('link').unsetLink().run()}><Unlink className="h-4 w-4" /></ToolButton>}
        {full && <>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-admin-border" />
          <ToolButton label="Bulleted list" active={state?.bullet} disabled={off} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolButton>
          <ToolButton label="Numbered list" active={state?.ordered} disabled={off} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolButton>
          <ToolButton label="Small heading" active={state?.heading} disabled={off} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolButton>
        </>}
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-admin-border" />
        <ToolButton label="Undo" disabled={off || !state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></ToolButton>
        <ToolButton label="Redo" disabled={off || !state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></ToolButton>
        <span className="ml-auto hidden pr-1 text-[11px] text-admin-muted sm:inline">Enter: new paragraph · Shift+Enter: line break</span>
      </div>
      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-admin-border px-2 py-2">
          <input
            aria-label="Link address"
            autoFocus
            value={linkValue}
            onChange={(event) => { setLinkValue(event.target.value); setLinkError(null); }}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyLink(); } if (event.key === 'Escape') setLinkOpen(false); }}
            placeholder="https://… or /events"
            className="min-h-8 flex-1 rounded-[6px] border border-admin-border bg-admin-bg px-2 text-sm text-white focus:border-rave-red focus:outline-none"
          />
          <button type="button" onClick={applyLink} className="min-h-8 rounded-[6px] bg-rave-red px-3 text-xs font-semibold text-white">Apply link</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="min-h-8 rounded-[6px] border border-admin-border px-3 text-xs text-white">Cancel</button>
          {linkError && <p role="alert" className="w-full text-xs text-rose-300">{linkError}</p>}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
