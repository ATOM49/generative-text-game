import { expect, test, type Page, type APIResponse } from '@playwright/test';

type CreatedWorld = {
  _id: string;
  name: string;
  mapImageUrl?: string;
};

type CreatedFaction = {
  _id: string;
  name: string;
  previewUrl?: string;
};

type CreatedCharacter = {
  _id: string;
  name: string;
  previewUrl?: string;
  biography?: string;
  gallery?: Array<{ imageUrl: string }>;
};

const waitForCreatedResource = (
  page: Page,
  pathname: string,
): Promise<APIResponse> =>
  page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        response.request().method() === 'POST' && url.pathname === pathname
      );
    },
    { timeout: 6 * 60 * 1000 },
  );

test('builder creates a generated world, species, and character', async ({
  page,
}) => {
  test.slow();

  const suffix = process.env.E2E_RUN_ID ?? 'playwright';
  const worldName = `E2E Aetherfall ${suffix}`;
  const speciesName = `Emberkin ${suffix}`;
  const characterName = `Lyra ${suffix}`;
  let world: CreatedWorld | undefined;
  let faction: CreatedFaction | undefined;
  let character: CreatedCharacter | undefined;

  try {
    await page.goto('/signin');
    await page
      .getByRole('button', { name: 'Continue with E2E account' })
      .click();
    await page.waitForURL(/\/choose-role(?:\?|$)/);

    await page.getByRole('button', { name: 'Start building' }).click();
    await page.waitForURL('/');
    await expect(
      page.getByRole('heading', { name: 'World Atlas' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'New World' }).click();
    const worldDialog = page.getByRole('dialog', {
      name: 'Create a New World',
    });
    await worldDialog.getByLabel('Name').fill(worldName);
    await worldDialog
      .getByLabel('Description')
      .fill('A floating fantasy archipelago built by the Playwright E2E flow.');
    await worldDialog.getByLabel('Theme').click();
    await page.getByRole('option', { name: 'fantasy' }).click();

    const worldResponsePromise = waitForCreatedResource(page, '/api/worlds');
    await worldDialog.locator('button[type="submit"]').click();
    const worldResponse = await worldResponsePromise;
    expect(worldResponse.status()).toBe(201);
    world = (await worldResponse.json()) as CreatedWorld;
    expect(world.mapImageUrl).toMatch(/^http:\/\/localhost:9000\/images\//);

    const worldCard = page.getByRole('link', { name: new RegExp(worldName) });
    await expect(worldCard).toBeVisible();
    await expect(
      worldCard.getByRole('img', { name: `${worldName} map` }),
    ).toBeVisible();
    await worldCard.click();
    await page.waitForURL(`/worlds/${world._id}/map`);

    await page.getByRole('tab', { name: 'Factions' }).click();
    await page.waitForURL(`/worlds/${world._id}/factions`);
    await page.getByRole('button', { name: 'New Faction' }).click();

    const factionDialog = page.getByRole('dialog', {
      name: 'Create New Faction',
    });
    await factionDialog.getByLabel('Name').fill(speciesName);
    await factionDialog
      .getByLabel(/One-line teaser that appears in cards and listings/)
      .fill('Fire-touched navigators of the floating isles.');
    await factionDialog
      .getByLabel(/Long-form description covering politics/)
      .fill('A luminous species known for ember-bright markings and skyships.');
    await factionDialog.getByLabel(/Determines whether this entry/).click();
    await page.getByRole('option', { name: 'species' }).click();
    await factionDialog
      .getByLabel(/High-level vibe or mood cues/)
      .fill('mythic and hopeful');

    const factionResponsePromise = waitForCreatedResource(
      page,
      `/api/worlds/${world._id}/factions`,
    );
    await factionDialog.locator('button[type="submit"]').click();
    const factionResponse = await factionResponsePromise;
    expect(factionResponse.status()).toBe(201);
    faction = (await factionResponse.json()) as CreatedFaction;
    expect(faction.previewUrl).toMatch(/^http:\/\/localhost:9000\/images\//);

    await expect(page.getByText(speciesName, { exact: true })).toBeVisible();
    await page.getByText(speciesName, { exact: true }).click();
    await expect(page.getByRole('img', { name: speciesName })).toBeVisible();

    await page.getByRole('tab', { name: 'Characters' }).click();
    await page.waitForURL(`/worlds/${world._id}/characters`);
    await page.getByRole('button', { name: 'Create Character' }).click();

    const characterDialog = page.getByRole('dialog', {
      name: 'Create Character',
    });
    await characterDialog.getByLabel('Name').fill(characterName);
    await characterDialog
      .getByLabel(/Short elevator pitch that introduces the character/)
      .fill('A young skyship cartographer searching for a lost ember compass.');
    await characterDialog.getByRole('combobox').click();
    await page.getByRole('option', { name: speciesName }).click();

    const characterResponsePromise = waitForCreatedResource(
      page,
      `/api/worlds/${world._id}/characters`,
    );
    await characterDialog
      .getByRole('button', { name: 'Create Character' })
      .click();
    const characterResponse = await characterResponsePromise;
    expect(characterResponse.status()).toBe(201);
    character = (await characterResponse.json()) as CreatedCharacter;
    expect(character.biography).toBeTruthy();
    expect(character.previewUrl).toMatch(/^http:\/\/localhost:9000\/images\//);
    expect(character.gallery?.length).toBeGreaterThanOrEqual(2);

    const characterCard = page.getByRole('link', {
      name: new RegExp(characterName),
    });
    await expect(characterCard).toBeVisible();
    await expect(
      characterCard.getByRole('img', { name: characterName }),
    ).toBeVisible();
  } finally {
    if (world && character) {
      await page.request.delete(
        `/api/worlds/${world._id}/characters/${character._id}`,
      );
    }
    if (world && faction) {
      await page.request.delete(
        `/api/worlds/${world._id}/factions/${faction._id}`,
      );
    }
    if (world) {
      await page.request.delete(`/api/worlds/${world._id}`);
    }
  }
});
