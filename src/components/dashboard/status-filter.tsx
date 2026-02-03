"use client";

import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IssueStatus } from "@/types/database";

export interface IssueFilters {
  status: IssueStatus | "all";
  search: string;
}

interface StatusFilterProps {
  filters: IssueFilters;
  onFiltersChange: (filters: IssueFilters) => void;
}

export function StatusFilter({ filters, onFiltersChange }: StatusFilterProps) {
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as IssueStatus | "all",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value,
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Status tabs */}
      <Tabs
        value={filters.status}
        onValueChange={handleStatusChange}
        className="w-full md:w-auto"
      >
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-none">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="addressed">Addressed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative w-full md:w-[300px]">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          value={filters.search}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>
    </div>
  );
}
