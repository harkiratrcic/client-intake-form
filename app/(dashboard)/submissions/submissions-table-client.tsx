'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubmissionsTable } from '../../../components/dashboard/submissions-table';
import { SubmissionsQueryResult } from '../../../lib/services/submission-query-service';

interface SubmissionsTableClientProps {
  initialData: SubmissionsQueryResult;
  initialSearchParams: {
    search: string;
    startDate?: string;
    endDate?: string;
    sortBy: string;
    sortOrder: string;
  };
}

export function SubmissionsTableClient({
  initialData,
  initialSearchParams,
}: SubmissionsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });

    // Reset to page 1 when filters change (except for page changes)
    if (!updates.page) {
      newSearchParams.set('page', '1');
    }

    startTransition(() => {
      router.push(`/dashboard/submissions?${newSearchParams.toString()}`);
      router.refresh();
    });
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };

  const handleSearch = (search: string) => {
    updateSearchParams({ search });
  };

  const handleDateFilter = (startDate?: string, endDate?: string) => {
    updateSearchParams({
      startDate,
      endDate,
    });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateSearchParams({
      sortBy,
      sortOrder,
    });
  };

  return (
    <div className={isPending ? 'opacity-75 pointer-events-none' : ''}>
      <SubmissionsTable
        submissions={data.submissions}
        total={data.total}
        page={data.page}
        limit={data.limit}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onSort={handleSort}
      />

      {isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading submissions...
          </div>
        </div>
      )}
    </div>
  );
}