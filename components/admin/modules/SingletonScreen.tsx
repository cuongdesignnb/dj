import ResourceForm from '@/components/admin/form/ResourceForm';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied, ErrorState } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import type { SingletonKey } from '@/lib/admin/common/resource';
import { gate, loadMediaChoices, loadOptionSets, optionSourcesOf } from '@/lib/admin/page-data';
import { SINGLETONS, getSingletonRepository } from '@/lib/admin/registry';
import IntegrationsPanel from './IntegrationsPanel';
import LanguageSettings from './LanguageSettings';

/** Server screen for one-record settings and page content. */
export default async function SingletonScreen({ settingKey }: { settingKey: SingletonKey }) {
  const definition = SINGLETONS[settingKey];
  const { session, allowed } = await gate(`${definition.permission}.view` as Permission);
  if (!allowed) return <AccessDenied />;

  const canEdit = can(session, `${definition.permission}.edit` as Permission);
  const result = await (await getSingletonRepository(settingKey)).get();
  const header = (
    <AdminPageHeader
      eyebrow={definition.group}
      title={definition.label}
      description={definition.description}
      trail={[{ label: 'Dashboard', href: '/admin' }, { label: definition.group }, { label: definition.label }]}
    />
  );

  if (!result.ok) {
    return (
      <>
        {header}
        <ErrorState title={`Could not load ${definition.label.toLowerCase()}`} message={result.error.message} />
      </>
    );
  }

  let body;
  if (settingKey === 'settings-integrations') {
    body = <IntegrationsPanel initial={result.data} canEdit={canEdit} />;
  } else if (settingKey === 'settings-languages') {
    body = <LanguageSettings initial={result.data} canEdit={canEdit} />;
  } else {
    const [optionSets, media] = await Promise.all([loadOptionSets(optionSourcesOf(definition)), loadMediaChoices()]);
    body = (
      <ResourceForm
        schema={definition.form}
        initial={result.data}
        target={{ kind: 'singleton', key: settingKey }}
        canEdit={canEdit}
        canPublish={false}
        optionSets={optionSets}
        media={media}
        submitLabel="Save Changes"
        previewHref={settingKey === 'content-home' ? '/' : settingKey === 'content-about' ? '/about' : null}
      />
    );
  }

  return (
    <PageReveal>
      {header}
      {body}
    </PageReveal>
  );
}
