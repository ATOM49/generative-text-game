import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WaterBodySchema, WaterBody } from '@talespin/schema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface WaterBodyFormProps {
  index?: number;
  waterBody?: WaterBody;
}

export function WaterBodyForm({ index, waterBody }: WaterBodyFormProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={index !== undefined ? `waterCoverage.${index}.type` : 'type'}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Type</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
