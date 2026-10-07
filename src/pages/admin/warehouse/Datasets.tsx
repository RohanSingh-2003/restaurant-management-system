import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button } from '../../../components/ui';
import { loadDataset, setCustomDataset, parseCSV, subscribeDatasetUpdates, recordsToCSV } from '../../../services/tarriDataService';
import { calculateDataQuality } from '../../../services/warehouse/etlService';
import type { TarriRecord, ColumnSchema, DataQualityReport } from '../../../types/dataset';

const REQUIRED_COLUMNS = [
  'OrderID',
  'Date',
  'DayOfWeek',
  'Time',
  'Category',
  'Line item name',
  'Quantity',
  'Price Per Item',
  'Gross Sales',
  'Est. Cost',
  'Est. Profit',
  'OrderType',
  'Payment',
  'Cancelled',
];

export function DatasetsPage() {
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<keyof TarriRecord>('date');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    loadDataset()
      .then((data) => {
        setRecords(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dataset', err);
        setIsLoading(false);
      });

    const unsubscribe = subscribeDatasetUpdates(() => {
      loadDataset(true).then((data) => {
        setRecords(data);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Compute Data Quality
  const qualityReport: DataQualityReport = useMemo(() => {
    return calculateDataQuality(records);
  }, [records]);

  // Compute Dataset Schema dynamically
  const schemaList: ColumnSchema[] = useMemo(() => {
    if (records.length === 0) return [];

    const defs: { name: string; key: keyof TarriRecord; type: string; desc: string }[] = [
      { name: 'OrderID', key: 'orderId', type: 'Identifier (String)', desc: 'Unique restaurant order basket token' },
      { name: 'Date', key: 'dateStr', type: 'Date (DD/MM/YYYY)', desc: 'Calendar date of order fulfillment' },
      { name: 'DayOfWeek', key: 'dayOfWeek', type: 'Categorical (String)', desc: 'Day of week (e.g. Saturday, Friday)' },
      { name: 'Time', key: 'time', type: 'Temporal (HH:MM)', desc: 'Time of order placement' },
      { name: 'Category', key: 'category', type: 'Categorical (String)', desc: 'Menu section (e.g. Main Courses, Drinks)' },
      { name: 'Line item name', key: 'lineItemName', type: 'Text (String)', desc: 'Specific menu item or dish name' },
      { name: 'Quantity', key: 'quantity', type: 'Numeric (Integer)', desc: 'Portion units ordered in transaction' },
      { name: 'Price Per Item', key: 'pricePerItem', type: 'Numeric (Currency £)', desc: 'Unit price per single dish portion' },
      { name: 'Gross Sales', key: 'grossSales', type: 'Numeric (Currency £)', desc: 'Total gross monetary intake for line' },
      { name: 'Est. Cost', key: 'estCost', type: 'Numeric (Currency £)', desc: 'Estimated cost of food ingredients' },
      { name: 'Est. Profit', key: 'estProfit', type: 'Numeric (Currency £)', desc: 'Net gross profit margin of line' },
      { name: 'OrderType', key: 'orderType', type: 'Categorical (String)', desc: 'Fulfillment channel (Delivery/Collection)' },
      { name: 'Payment', key: 'payment', type: 'Categorical (String)', desc: 'Payment method utilized' },
      { name: 'Cancelled', key: 'cancelled', type: 'Boolean (Yes/No)', desc: 'Audit flag marking cancelled transactions' },
    ];

    return defs.map((d) => {
      const uniqueVals = new Set(records.map((r) => String(r[d.key])));
      const missing = records.filter((r) => r[d.key] === undefined || r[d.key] === null || r[d.key] === '').length;
      const samples = Array.from(uniqueVals).slice(0, 3);

      return {
        name: d.name,
        dataType: d.type,
        description: d.desc,
        missingCount: missing,
        uniqueCount: uniqueVals.size,
        sampleValues: samples,
      };
    });
  }, [records]);

  // Unique Order Count & Date Range
  const datasetMeta = useMemo(() => {
    if (records.length === 0) return null;
    const uniqueOrders = new Set(records.map((r) => r.orderId)).size;
    const cancelledCount = records.filter((r) => r.cancelled).length;

    let minDate = records[0].date;
    let maxDate = records[0].date;
    for (const r of records) {
      if (r.date < minDate) minDate = r.date;
      if (r.date > maxDate) maxDate = r.date;
    }

    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    return {
      name: 'tarri_data.csv',
      fileType: 'Comma-Separated Values (CSV)',
      totalRows: records.length,
      totalColumns: 14,
      uniqueOrders,
      dateRange: `${fmt(minDate)} → ${fmt(maxDate)}`,
      cancelledRecords: cancelledCount,
    };
  }, [records]);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    let list = records;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.orderId.toLowerCase().includes(q) ||
          r.lineItemName.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.orderType.toLowerCase().includes(q) ||
          r.payment.toLowerCase().includes(q) ||
          r.dateStr.includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [records, searchQuery, sortField, sortAsc]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice('Refreshing dataset from source...');
    try {
      const refreshed = await loadDataset(true);
      setRecords(refreshed);
      setRefreshNotice('Dataset refreshed successfully.');
      setTimeout(() => setRefreshNotice(null), 3000);
    } catch (err) {
      console.error(err);
      setRefreshNotice('Failed to refresh dataset.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Optional Schema-validating Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const firstLine = text.split(/\r?\n/)[0] || '';
      const headers = firstLine.split(',').map((h) => h.trim());

      const missing = REQUIRED_COLUMNS.filter(
        (req) => !headers.some((h) => h.toLowerCase() === req.toLowerCase())
      );

      if (missing.length > 0) {
        setUploadError(`Invalid dataset schema. Missing required columns: ${missing.join(', ')}`);
        return;
      }

      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setUploadError('CSV contains no data rows.');
          return;
        }
        setCustomDataset(parsed);
        setRecords(parsed);
        setCurrentPage(1);
        setRefreshNotice(`Loaded custom dataset with ${parsed.length.toLocaleString('en-GB')} records.`);
        setTimeout(() => setRefreshNotice(null), 3000);
      } catch (err) {
        console.error(err);
        setUploadError('Failed to parse uploaded CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleSort = (field: keyof TarriRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const csvContent = recordsToCSV(records);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `restaurant_dataset_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Datasets</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage and inspect the data used by the restaurant analytics system.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCSV}
            disabled={isLoading || records.length === 0}
            className="text-xs bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
          >
            Export CSV
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="text-xs bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
          >
            {isRefreshing ? 'Refreshing dataset...' : 'Refresh Dataset'}
          </Button>

          <label className="text-xs px-3 py-2 rounded-md bg-accent text-white font-medium hover:bg-accent/90 cursor-pointer transition-colors">
            Replace CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Notice Banners */}
      {refreshNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {refreshNotice}
        </div>
      )}
      {uploadError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {uploadError}
        </div>
      )}

      {/* Academic Explanation Card */}
      <Card className="border border-neutral-100 bg-white">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Warehouse Provenance
        </span>
        <h3 className="text-sm font-semibold text-neutral-800 mt-0.5">
          What data is the system currently analyzing?
        </h3>
        <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
          The restaurant analytics suite operates on an un-synthesized operational transaction log containing line items for every dish and beverage fulfillment. All downstream KPIs in Overview, Sales, Customers, Products, OLAP, and Data Mining share this single verified source of truth.
        </p>
      </Card>

      {/* 2. Dataset Summary Cards */}
      {datasetMeta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="border border-neutral-100 bg-white p-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Dataset Name
            </span>
            <div className="text-sm font-bold text-neutral-800 mt-1 font-mono truncate">
              {datasetMeta.name}
            </div>
            <span className="text-[10px] text-neutral-400">Static source</span>
          </Card>

          <Card className="border border-neutral-100 bg-white p-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Total Rows
            </span>
            <div className="text-sm font-bold text-neutral-800 mt-1 font-mono">
              {datasetMeta.totalRows.toLocaleString('en-GB')}
            </div>
            <span className="text-[10px] text-neutral-400">Line items</span>
          </Card>

          <Card className="border border-neutral-100 bg-white p-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Total Columns
            </span>
            <div className="text-sm font-bold text-neutral-800 mt-1 font-mono">
              {datasetMeta.totalColumns}
            </div>
            <span className="text-[10px] text-neutral-400">Schema attributes</span>
          </Card>

          <Card className="border border-neutral-100 bg-white p-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Unique Orders
            </span>
            <div className="text-sm font-bold text-neutral-800 mt-1 font-mono">
              {datasetMeta.uniqueOrders.toLocaleString('en-GB')}
            </div>
            <span className="text-[10px] text-neutral-400">Unique OrderIDs</span>
          </Card>

          <Card className="border border-neutral-100 bg-white p-3 sm:col-span-2">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Date Span
            </span>
            <div className="text-sm font-bold text-neutral-800 mt-1 font-mono">
              {datasetMeta.dateRange}
            </div>
            <span className="text-[10px] text-neutral-400">36 active operational months</span>
          </Card>

          <Card className="border border-neutral-100 bg-white p-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Cancelled
            </span>
            <div className="text-sm font-bold text-rose-700 mt-1 font-mono">
              {datasetMeta.cancelledRecords} rows
            </div>
            <span className="text-[10px] text-neutral-400">Audit flagged</span>
          </Card>
        </div>
      )}

      {/* 3. Data Quality Inspection */}
      <Card className="border border-neutral-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">
              Data Quality & Integrity Audit
            </h3>
            <p className="text-xs text-neutral-500">
              Real calculations performed directly on the loaded dataset records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Completeness: {qualityReport.completenessScore}%
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Accuracy: {qualityReport.accuracyScore}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-500">Missing Values</span>
            <p className="text-base font-bold text-neutral-800 mt-0.5 font-mono">
              {qualityReport.missingValues}
            </p>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-500">Duplicate Rows</span>
            <p className="text-base font-bold text-neutral-800 mt-0.5 font-mono">
              {qualityReport.duplicateRows}
            </p>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-500">Invalid Numerics</span>
            <p className="text-base font-bold text-neutral-800 mt-0.5 font-mono">
              {qualityReport.invalidNumericValues}
            </p>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-500">Invalid Dates</span>
            <p className="text-base font-bold text-neutral-800 mt-0.5 font-mono">
              {qualityReport.invalidDates}
            </p>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-500">Cancelled Rows</span>
            <p className="text-base font-bold text-rose-700 mt-0.5 font-mono">
              {qualityReport.cancelledRecords}
            </p>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-500">Valid Order Rows</span>
            <p className="text-base font-bold text-emerald-700 mt-0.5 font-mono">
              {(qualityReport.totalRows - qualityReport.cancelledRecords).toLocaleString('en-GB')}
            </p>
          </div>
        </div>
      </Card>

      {/* 4. Data Preview Table */}
      <Card className="border border-neutral-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">
              Data Preview ({filteredRecords.length.toLocaleString('en-GB')} rows)
            </h3>
            <p className="text-xs text-neutral-500">
              Paginated view of the actual transaction line items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search orders, items, categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-1.5 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-800 w-60 focus:outline-none focus:border-accent"
            />

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs px-2 py-1.5 rounded-md border border-neutral-200 bg-white text-neutral-700"
            >
              <option value={15}>15 rows / page</option>
              <option value={25}>25 rows / page</option>
              <option value={50}>50 rows / page</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th onClick={() => handleSort('orderId')} className="px-3 py-2.5 cursor-pointer hover:text-neutral-800">
                  OrderID {sortField === 'orderId' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('date')} className="px-3 py-2.5 cursor-pointer hover:text-neutral-800">
                  Date {sortField === 'date' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="px-3 py-2.5">Day</th>
                <th className="px-3 py-2.5">Time</th>
                <th onClick={() => handleSort('category')} className="px-3 py-2.5 cursor-pointer hover:text-neutral-800">
                  Category {sortField === 'category' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('lineItemName')} className="px-3 py-2.5 cursor-pointer hover:text-neutral-800">
                  Line item name {sortField === 'lineItemName' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('quantity')} className="px-3 py-2.5 text-right cursor-pointer hover:text-neutral-800">
                  Qty {sortField === 'quantity' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('pricePerItem')} className="px-3 py-2.5 text-right cursor-pointer hover:text-neutral-800">
                  Price {sortField === 'pricePerItem' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('grossSales')} className="px-3 py-2.5 text-right cursor-pointer hover:text-neutral-800">
                  Gross Sales {sortField === 'grossSales' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('estProfit')} className="px-3 py-2.5 text-right cursor-pointer hover:text-neutral-800">
                  Est. Profit {sortField === 'estProfit' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="px-3 py-2.5">Channel</th>
                <th className="px-3 py-2.5">Payment</th>
                <th className="px-3 py-2.5 text-center">Cancelled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {paginatedRecords.map((r, idx) => (
                <tr key={`${r.orderId}-${idx}`} className="hover:bg-neutral-50/50">
                  <td className="px-3 py-2 font-semibold text-neutral-800">{r.orderId}</td>
                  <td className="px-3 py-2 text-neutral-600">{r.dateStr}</td>
                  <td className="px-3 py-2 text-neutral-600">{r.dayOfWeek}</td>
                  <td className="px-3 py-2 text-neutral-600">{r.time}</td>
                  <td className="px-3 py-2 font-sans text-neutral-700">{r.category}</td>
                  <td className="px-3 py-2 font-sans font-medium text-neutral-800 truncate max-w-[160px]">
                    {r.lineItemName}
                  </td>
                  <td className="px-3 py-2 text-right text-neutral-800">{r.quantity}</td>
                  <td className="px-3 py-2 text-right text-neutral-800">£{r.pricePerItem.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-neutral-900">£{r.grossSales.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-emerald-700">£{r.estProfit.toFixed(2)}</td>
                  <td className="px-3 py-2 font-sans text-neutral-600">{r.orderType}</td>
                  <td className="px-3 py-2 font-sans text-neutral-600">{r.payment}</td>
                  <td className="px-3 py-2 text-center">
                    {r.cancelled ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Yes
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[10px]">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredRecords.length)} of{' '}
            {filteredRecords.length.toLocaleString('en-GB')} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-2.5 py-1 rounded border border-neutral-200 bg-white text-neutral-700 disabled:opacity-40 hover:bg-neutral-50"
            >
              First
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-neutral-200 bg-white text-neutral-700 disabled:opacity-40 hover:bg-neutral-50"
            >
              Previous
            </button>
            <span className="px-2 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-neutral-200 bg-white text-neutral-700 disabled:opacity-40 hover:bg-neutral-50"
            >
              Next
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2.5 py-1 rounded border border-neutral-200 bg-white text-neutral-700 disabled:opacity-40 hover:bg-neutral-50"
            >
              Last
            </button>
          </div>
        </div>
      </Card>

      {/* 5. Dataset Schema Table */}
      <Card className="border border-neutral-100 bg-white">
        <div className="mb-3 pb-2 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-800">
            Dataset Schema & Column Metadata
          </h3>
          <p className="text-xs text-neutral-500">
            Calculated data types, descriptions, cardinality, and missing value counts.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2.5">Column Name</th>
                <th className="px-4 py-2.5">Inferred Data Type</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Missing</th>
                <th className="px-4 py-2.5 text-right">Unique Values</th>
                <th className="px-4 py-2.5">Sample Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {schemaList.map((col) => (
                <tr key={col.name} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-2.5 font-mono font-semibold text-neutral-800">
                    {col.name}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">{col.dataType}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{col.description}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-neutral-700">
                    {col.missingCount}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-neutral-800 font-semibold">
                    {col.uniqueCount.toLocaleString('en-GB')}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 font-mono text-[11px] truncate max-w-[200px]">
                    {col.sampleValues.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
