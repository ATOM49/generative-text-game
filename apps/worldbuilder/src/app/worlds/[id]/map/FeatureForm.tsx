import React from 'react';
import { Feature } from '@talespin/schema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFormContext } from 'react-hook-form';

interface FeatureFormProps {
  index?: number;
  feature?: Feature;
}

export function FeatureForm({ index, feature }: FeatureFormProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={index !== undefined ? `features.${index}.name` : 'name'}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
