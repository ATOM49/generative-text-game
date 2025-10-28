import React from 'react';
import { River } from '@talespin/schema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface RiverFormProps {
  index?: number;
  river?: River;
  control: any;
}

export function RiverForm({ index, river, control }: RiverFormProps) {
  return (
    <FormField
      control={control}
      name={index !== undefined ? `rivers.${index}.name` : 'name'}
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
