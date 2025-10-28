import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  RegionForm as IRegionForm,
  Region,
  WorldMapForm,
} from '@talespin/schema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface RegionFormProps {
  index?: number;
  region?: IRegionForm;
  onSubmit?: (data: Region) => void;
}

export function RegionForm({ index, region, onSubmit }: RegionFormProps) {
  const { control } = useFormContext<WorldMapForm>();
  return (
    <>
      <FormField
        control={control}
        name={index !== undefined ? `regions.${index}.name` : `regions.0.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={
          index !== undefined ? `regions.${index}.terrain` : `regions.0.terrain`
        }
        render={({ field }) => (
          <FormItem>
            <FormLabel>Terrain</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={
          index !== undefined ? `regions.${index}.climate` : `regions.0.climate`
        }
        render={({ field }) => (
          <FormItem>
            <FormLabel>Climate</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* WaterBodies */}
      {/* <FormField
        control={control}
        name={
          index !== undefined
            ? `regions.${index}.waterCoverage`
            : `regions.0.waterCoverage`
        }
        render={({ field }) => (
          <FormItem>
            <FormLabel>Water Bodies</FormLabel>
            <FormControl>
              {Array.isArray(field.value) &&
                field.value.map((wb: any, wbIdx: number) => (
                  <WaterBodyForm key={wbIdx} index={wbIdx} waterBody={wb} control={control} />
                ))}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      /> */}
      {/* Rivers */}
      {/* <FormField
        control={control}
        name={
          index !== undefined ? `regions.${index}.rivers` : `regions.0.rivers`
        }
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rivers</FormLabel>
            <FormControl>
              {Array.isArray(field.value) &&
                field.value.map((rv: any, rvIdx: number) => (
                  <RiverForm key={rvIdx} index={rvIdx} river={rv} control={control} />
                ))}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      /> */}
      {/* Features */}
      {/* <FormField
        control={control}
        name={
          index !== undefined
            ? `regions.${index}.features`
            : `regions.0.features`
        }
        render={({ field }) => (
          <FormItem>
            <FormLabel>Features</FormLabel>
            <FormControl>
              {Array.isArray(field.value) &&
                field.value.map((ft: any, ftIdx: number) => (
                  <FeatureForm key={ftIdx} index={ftIdx} feature={ft} control={control} />
                ))}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      /> */}
    </>
  );
}
