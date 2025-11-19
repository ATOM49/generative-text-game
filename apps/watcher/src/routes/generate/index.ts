import { FastifyPluginAsync } from 'fastify';
import mapRoute from './map';
import editImageRoute from './edit-image';

const generateRoutes: FastifyPluginAsync = async (fastify) => {
  // Register map generation route
  fastify.register(mapRoute, { prefix: '/map' });

  // Register image editing route
  fastify.register(editImageRoute, { prefix: '/edit-image' });

  // TODO: Add more generation routes here
  // fastify.register(regionRoute, { prefix: '/region' });
  // fastify.register(eventRoute, { prefix: '/event' });
  // fastify.register(locationRoute, { prefix: '/location' });
  // fastify.register(factionRoute, { prefix: '/faction' });
};

export default generateRoutes;
