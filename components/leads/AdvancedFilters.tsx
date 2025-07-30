"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, X, Search, DollarSign, Package, Tag, Clock } from "lucide-react";
import { LeadFilters } from '@/services/leadService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface AdvancedFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

// Lead sources will be fetched from suppliers table

const LEAD_STATUSES = [
  'New', 'Contacted', 'Qualified', 'Unqualified', 'Customer', 'DNC'
];

const TIME_PRESETS = [
  { label: 'Last 7 days', days: 7, value: '7days' },
  { label: 'Last 1 month', days: 30, value: '1month' },
  { label: 'Last 3 months', days: 90, value: '3months' },
  { label: 'Last 6 months', days: 180, value: '6months' },
  { label: 'Last 1 year', days: 365, value: '1year' },
  { label: 'Custom range', days: 0, value: 'custom' },
];

export default function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onApplyFilters, 
  onClearFilters 
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // Fetch available suppliers/sources
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/suppliers');
        if (response.ok) {
          const suppliers = await response.json();
          const sourceNames = suppliers.map((supplier: any) => supplier.name).filter(Boolean);
          setAvailableSources(sourceNames);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        // Fallback to some common sources if API fails
        setAvailableSources(['Unknown Supplier']);
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, []);

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleSourceToggle = (source: string) => {
    const currentSources = filters.sources || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter(s => s !== source)
      : [...currentSources, source];
    
    handleFilterChange('sources', newSources);
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.statuses || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    handleFilterChange('statuses', newStatuses);
  };

  const handleTimePreset = (days: number) => {
    const today = new Date();
    const fromDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    
    setDateFrom(fromDate);
    setDateTo(today);
    
    onFiltersChange({
      ...filters,
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    handleFilterChange('dateFrom', date ? date.toISOString().split('T')[0] : undefined);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    handleFilterChange('dateTo', date ? date.toISOString().split('T')[0] : undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.sources && filters.sources.length > 0) count++;
    if (filters.statuses && filters.statuses.length > 0) count++;
    if (filters.costMin !== undefined || filters.costMax !== undefined) count++;
    if (filters.batchIds && filters.batchIds.length > 0) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Label>
            <Input
              placeholder="Search leads by name, email, company, phone, address, city, state, country, tax ID, tags..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Search across all lead fields including: name, email, phone, company, address, city, state, country, tax ID, lead source, status, notes, and tags
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Range
            </Label>
            
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimePreset(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={handleDateFromChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={handleDateToChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Lead Sources (Suppliers) */}
          <div className="space-y-2">
            <Label>Lead Sources (Suppliers)</Label>
            {loadingSources ? (
              <div className="text-sm text-muted-foreground">Loading suppliers...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSources.map((source) => (
                  <Badge
                    key={source}
                    variant={filters.sources?.includes(source) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSourceToggle(source)}
                  >
                    {source}
                    {filters.sources?.includes(source) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
                {availableSources.length === 0 && (
                  <div className="text-sm text-muted-foreground">No suppliers found</div>
                )}
              </div>
            )}
          </div>

          {/* Lead Statuses */}
          <div className="space-y-2">
            <Label>Lead Statuses</Label>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <Badge
                  key={status}
                  variant={filters.statuses?.includes(status) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleStatusToggle(status)}
                >
                  {status}
                  {filters.statuses?.includes(status) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Cost Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Range
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Cost</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.costMin || ''}
                  onChange={(e) => handleFilterChange('costMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Cost</Label>
                <Input
                  type="number"
                  placeholder="1000.00"
                  value={filters.costMax || ''}
                  onChange={(e) => handleFilterChange('costMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <Input
              placeholder="Enter tags separated by commas (e.g., premium, qualified, hot-lead)"
              value={filters.tags?.join(', ') || ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                handleFilterChange('tags', tags.length > 0 ? tags : undefined);
              }}
            />
            <div className="text-xs text-muted-foreground">
              Search for leads that contain any of these tags. Tags are case-insensitive.
            </div>
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => {
                        const newTags = filters.tags?.filter((_, i) => i !== index);
                        handleFilterChange('tags', newTags && newTags.length > 0 ? newTags : undefined);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={onClearFilters}>
              Clear All
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}