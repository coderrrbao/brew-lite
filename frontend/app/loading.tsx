import { PageShell, SpinnerIcon } from '@/components/ui';

export default function Loading() {
  return <PageShell className="flex justify-center text-muted-foreground"><span role="status"><SpinnerIcon size={28} /></span></PageShell>;
}
