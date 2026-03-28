'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';

export interface LoadFileButtonProps {
  onFileLoad: (content: string, file: File) => void;
  accept?: string;
  label?: string;
  className?: string;
}

export function LoadFileButton({
  onFileLoad,
  accept = '*/*',
  label = 'Load File',
  className,
}: LoadFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onFileLoad(event.target?.result as string, file);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
      <Button
        variant="outline"
        size="sm"
        className={cn('h-8 px-3 text-xs', className)}
        onClick={() => inputRef.current?.click()}
      >
        <ArrowUpTrayIcon className="h-3 w-3 mr-1" />
        {label}
      </Button>
    </>
  );
}
