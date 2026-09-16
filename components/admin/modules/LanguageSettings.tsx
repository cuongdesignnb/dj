'use client';

import { useState } from 'react';
import { saveSingleton } from '@/app/admin/actions';
import { sameValue } from '@/lib/admin/common/paths';
import { inputClass } from '../form/FieldInput';
import { buttonClass } from '../ui/Dialog';
import StatusBadge from '../ui/StatusBadge';
import { useToast } from '../ui/Toast';

type Status = 'complete' | 'partial' | 'missing';
interface Row {
  module: string;
  en: Status;
  vi: Status;
}
interface LanguageValues {
  defaultLanguage: 'en' | 'vi';
  enabled: string[];
  translations: Row[];
}

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'vi', label: 'Tiếng Việt' },
] as const;

const STATUSES: { value: Status; label: string }[] = [
  { value: 'complete', label: 'Complete' },
  { value: 'partial', label: 'Partial' },
  { value: 'missing', label: 'Missing' },
];

/** Language switches plus a module × language translation matrix. */
export default function LanguageSettings({ initial, canEdit }: { initial: Record<string, unknown>; canEdit: boolean }) {
  const toast = useToast();
  const start = initial as unknown as LanguageValues;
  const [values, setValues] = useState<LanguageValues>(start);
  const [saved, setSaved] = useState<LanguageValues>(start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = !sameValue(values, saved);

  const toggleLang = (id: string) => {
    const on = values.enabled.includes(id);
    if (on && id === values.defaultLanguage) {
      setError('The default language must stay enabled.');
      return;
    }
    setError(null);
    setValues({ ...values, enabled: on ? values.enabled.filter((l) => l !== id) : [...values.enabled, id] });
  };

  const save = async () => {
    setBusy(true);
    const result = await saveSingleton('settings-languages', values);
    setBusy(false);
    if (result.ok) {
      const next = result.data as unknown as LanguageValues;
      setValues(next);
      setSaved(next);
      toast('success', result.message ?? 'Saved.');
    } else {
      toast('error', result.error.message);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <section aria-labelledby="lang-title" className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
        <h2 id="lang-title" className="font-heading text-base font-semibold uppercase tracking-[0.08em] text-white">
          Languages
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/90">Default language</span>
            <select
              value={values.defaultLanguage}
              disabled={!canEdit}
              onChange={(e) => {
                const lang = e.target.value as 'en' | 'vi';
                setValues({ ...values, defaultLanguage: lang, enabled: values.enabled.includes(lang) ? values.enabled : [...values.enabled, lang] });
              }}
              className={inputClass}
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-white/90">Enabled on the site</legend>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <label key={l.id} className="inline-flex min-h-[42px] items-center gap-2 rounded-[8px] border border-admin-border bg-admin-deep px-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={values.enabled.includes(l.id)}
                    disabled={!canEdit}
                    onChange={() => toggleLang(l.id)}
                    aria-describedby={error ? 'lang-error' : undefined}
                    className="h-4 w-4 accent-[#FF173D]"
                  />
                  {l.label}
                </label>
              ))}
            </div>
            {error && (
              <p id="lang-error" role="alert" className="mt-1 text-xs text-[#FF6B82]">
                {error}
              </p>
            )}
          </fieldset>
        </div>
      </section>

      <section aria-labelledby="matrix-title" className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
        <h2 id="matrix-title" className="font-heading text-base font-semibold uppercase tracking-[0.08em] text-white">
          Translation status
        </h2>
        <p className="mt-1 text-sm text-admin-muted">Set by editors. No machine translation is used; empty Vietnamese fields fall back to English.</p>
        <div className="relative mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">Translation status by module</caption>
            <thead>
              <tr className="border-b border-admin-border text-left text-xs uppercase tracking-wider text-admin-muted">
                <th scope="col" className="py-2 pr-3 font-medium">Module</th>
                {LANGS.map((l) => (
                  <th key={l.id} scope="col" className="py-2 pr-3 font-medium">
                    {l.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.translations.map((row, index) => (
                <tr key={row.module} className="border-b border-admin-border/60 last:border-0">
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-white">
                    {row.module}
                  </th>
                  {LANGS.map((l) => (
                    <td key={l.id} className="py-2 pr-3">
                      {canEdit ? (
                        <select
                          aria-label={`${row.module}, ${l.label}`}
                          value={row[l.id]}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              translations: values.translations.map((r, i) => (i === index ? { ...r, [l.id]: e.target.value as Status } : r)),
                            })
                          }
                          className={`${inputClass} min-h-[36px] max-w-[160px] py-1`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge value={row[l.id]} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {canEdit && (
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy || !dirty} className={buttonClass.primary}>
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
          <span aria-live="polite" className={`text-xs ${dirty ? 'text-admin-warning' : 'text-admin-muted'}`}>
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>
      )}
    </form>
  );
}
