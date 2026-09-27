import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Contract } from '@/lib/types';

const STATUS_TONES = { ACTIVE: 'green', PENDING: 'neutral', REJECTED: 'outline' } as const;

export function ContractRow({ contract }: { contract: Contract }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[15px] font-medium text-ink">{contract.planName}</p>
        <p className="mt-0.5 text-[12px] text-subtle">
          {contract.id.slice(0, 8).toUpperCase()} · {formatDateTime(contract.createdAt)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <Badge tone={STATUS_TONES[contract.status]}>{contract.status}</Badge>
        <p className="tabular text-[15px] font-medium text-ink">{formatCurrency(contract.price)}</p>
      </div>
    </div>
  );
}
