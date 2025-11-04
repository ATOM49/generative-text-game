import { Prisma } from '@prisma/client';

// Creates type for World with all relations loaded
type WorldWithRelations = Prisma.WorldGetPayload<{
  include: {
    worldMap: true;
  };
}>;

type WorldWhereInput = Prisma.WorldWhereInput;
type WorldSelect = {
  include: {
    worldMap: boolean;
  };
};
