import { FastifyPluginAsync } from 'fastify';
import map from './map.js';
import editImage from './edit-image.js';
import character from './character.js';
import faction from './faction.js';
import factionDetails from './faction-details.js';

const generateRoutes: FastifyPluginAsync = async (fastify) => {
  // Register map generation route
  fastify.register(map, { prefix: '/map' });
  // Register image editing route
  fastify.register(editImage, { prefix: '/edit-image' });
  // Character portrait generation
  fastify.register(character, { prefix: '/character' });
  // Faction image generation
  fastify.register(faction, { prefix: '/faction' });
  // Faction details generation
  fastify.register(factionDetails, { prefix: '/faction-details' });
};

export default generateRoutes;
