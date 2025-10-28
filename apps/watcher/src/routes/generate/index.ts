import { FastifyPluginAsync } from 'fastify';
import generateChapter from './chapter';
import generateFactions from './factions';
import generateInteraction from './interaction';
import generateLocations from './locations';
import generateMission from './mission';
import generateNarrative from './narrative';
import generatePlayerArc from './player-arc';
import generateRules from './rules';
import generateSpecies from './species';
import generateWorldContext from './world-context';

const generateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(generateChapter, { prefix: '/chapter' });
  fastify.register(generateFactions, { prefix: '/factions' });
  fastify.register(generateInteraction, { prefix: '/interaction' });
  fastify.register(generateLocations, { prefix: '/locations' });
  fastify.register(generateMission, { prefix: '/mission' });
  fastify.register(generateNarrative, { prefix: '/narrative' });
  fastify.register(generatePlayerArc, { prefix: '/player-arc' });
  fastify.register(generateRules, { prefix: '/rules' });
  fastify.register(generateSpecies, { prefix: '/species' });
  fastify.register(generateWorldContext, { prefix: '/world-context' });
};

export default generateRoutes;
