import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Contract } from '@/lib/types';

export function ContractRow({ contract }: { contract: Contract }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[15px] font-medium text-ink">
          {contract.planName} partnership
        </p>
        <p className="mt-0.5 text-[12px] text-subtle">
          {contract.id} · {formatDateTime(contract.createdAt)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <Badge tone={contract.status === 'ACTIVE' ? 'green' : 'neutral'}>
          {contract.status}
        </Badge>
        <div className="text-right">
          <p className="tabular text-[15px] font-medium text-ink">
            {formatCurrency(contract.investment)}
          </p>
          <p className="tabular text-[12px] text-money">
            → {formatCurrency(contract.totalPayout)}
          </p>
        </div>
      </div>
    </div>
  );
}
