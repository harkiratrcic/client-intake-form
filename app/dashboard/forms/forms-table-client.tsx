'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormsTable } from '../../../components/dashboard/forms-table';
import { FormsQueryResult } from '../../../lib/services/forms-query-service';

interface FormsTableClientProps {
  initialData: FormsQueryResult;
  initialSearchParams: {
    search?: string;
    status?: string;
    sortBy: string;
    sortOrder: string;
  };
}

export function FormsTableClient({ initialData, initialSearchParams }: FormsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when changing filters/search
    if (updates.search !== undefined || updates.status !== undefined) {
      params.set('page', '1');
    }

    router.push(`/dashboard/forms?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };

  const handleSearch = (search: string) => {
    updateSearchParams({ search: search || undefined });
  };

  const handleStatusFilter = (status: string) => {
    updateSearchParams({ status: status || undefined });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateSearchParams({ sortBy, sortOrder });
  };

  return (
    <FormsTable
      forms={initialData.forms}
      total={initialData.total}
      page={initialData.page}
      limit={initialData.limit}
      totalPages={initialData.totalPages}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      onStatusFilter={handleStatusFilter}
      onSort={handleSort}
    />
  );
}