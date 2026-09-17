import { PageHeader, EmptyState } from '../../components/ui';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
}

export function PlaceholderPage({ title, subtitle, description }: PlaceholderPageProps) {
  return (
    <div className="w-full min-w-0">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="mt-8">
        <EmptyState title={title} description={description} />
      </div>
    </div>
  );
}
