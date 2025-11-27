import { FastifyPluginAsync } from 'fastify';
import map from './map';
import editImage from './edit-image';
import character from './character';
import faction from './faction';

const generateRoutes: FastifyPluginAsync = async (fastify) => {
  // Register map generation route
  fastify.register(map, { prefix: '/map' });
  // Register image editing route
  fastify.register(editImage, { prefix: '/edit-image' });
  // Character portrait generation
  fastify.register(character, { prefix: '/character' });
  // Faction image generation
  fastify.register(faction, { prefix: '/faction' });
};

export default generateRoutes;
