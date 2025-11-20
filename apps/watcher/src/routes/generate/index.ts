import { FastifyPluginAsync } from 'fastify';
import map from './map.js';
import editImage from './edit-image.js';

const generateRoutes: FastifyPluginAsync = async (fastify) => {
  // Register map generation route
  fastify.register(map, { prefix: '/map' });
  // Register image editing route
  fastify.register(editImage, { prefix: '/edit-image' });
};

export default generateRoutes;
