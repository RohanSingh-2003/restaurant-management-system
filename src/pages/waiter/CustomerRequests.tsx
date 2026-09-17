import { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { ServiceRequestStatus } from '../../types/operational';

export function CustomerRequestsPage() {
  const { requests, acknowledgeRequest, completeRequest } = useOperationalData();
  const [filterStatus, setFilterStatus] = useState<ServiceRequestStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTime] = useState(() => Date.now());

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchQuery =
        searchQuery === '' ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `Table ${r.tableNumber}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.details && r.details.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchQuery;
    });
  }, [requests, filterStatus, searchQuery]);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const acknowledgedCount = requests.filter((r) => r.status === 'Acknowledged').length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;

  const formatTimeAgo = (isoString: string) => {
    const diffMs = nowTime - new Date(isoString).getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Customer Requests</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Service calls, assistance and dining floor requests from customer tables.
          </p>
        </div>
      </div>

      {/* Operational Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Attention</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{pendingCount}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Awaiting server acknowledgement</p>
        </Card>

        <Card className="p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="h-4 w-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{acknowledgedCount}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Staff attending table</p>
        </Card>

        <Card className="p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{completedCount}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Requests fulfilled today</p>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'Pending'
                ? 'bg-amber-500 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('Acknowledged')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'Acknowledged'
                ? 'bg-sky-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Acknowledged ({acknowledgedCount})
          </button>
          <button
            onClick={() => setFilterStatus('Completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'Completed'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search table or request..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Requests Ledger Table */}
      <Card padding="none" className="border border-neutral-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Request</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-400">
                    No customer requests matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-neutral-800">
                      Table {req.tableNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-800">{req.type}</div>
                      {req.details && (
                        <div className="text-[11px] text-neutral-400 mt-0.5">{req.details}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                      {formatTimeAgo(req.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          req.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : req.status === 'Acknowledged'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'Pending' ? (
                        <button
                          onClick={() => acknowledgeRequest(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      ) : req.status === 'Acknowledged' ? (
                        <button
                          onClick={() => completeRequest(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-neutral-400">Fulfilled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
