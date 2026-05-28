import { Assets, Spritesheet, Texture } from 'pixi.js';

const SPRITE_MANIFEST: Record<string, string> = {
  megaman_mega_buster: 'sprites/megaman/megaman_mega_buster.json',
  megaman_rolling_cutter: 'sprites/megaman/megaman_rolling_cutter.json',
  megaman_super_arm: 'sprites/megaman/megaman_super_arm.json',
  megaman_ice_slasher: 'sprites/megaman/megaman_ice_slasher.json',
  megaman_hyper_bomb: 'sprites/megaman/megaman_hyper_bomb.json',
  megaman_fire_storm: 'sprites/megaman/megaman_fire_storm.json',
  megaman_thunder_beam: 'sprites/megaman/megaman_thunder_beam.json',
  boss_cut_man: 'sprites/bosses/cut_man.json',
  boss_guts_man: 'sprites/bosses/guts_man.json',
  boss_ice_man: 'sprites/bosses/ice_man.json',
  boss_bomb_man: 'sprites/bosses/bomb_man.json',
  boss_fire_man: 'sprites/bosses/fire_man.json',
  boss_elec_man: 'sprites/bosses/elec_man.json',
  enemy_met: 'sprites/enemies/met.json',
  enemy_sniper_joe: 'sprites/enemies/sniper_joe.json',
  enemy_blaster: 'sprites/enemies/blaster.json',
  enemy_flea: 'sprites/enemies/flea.json',
  enemy_screw_bomber: 'sprites/enemies/screw_bomber.json',
  enemy_penguin: 'sprites/enemies/penguin.json',
  enemy_foot_holder: 'sprites/enemies/foot_holder.json',
  ui_sprites: 'ui/ui_sprites.json',
  tileset_cutman: 'tilesets/tileset_cutman.json',
  tileset_gutsman: 'tilesets/tileset_gutsman.json',
  tileset_iceman: 'tilesets/tileset_iceman.json',
  tileset_bombman: 'tilesets/tileset_bombman.json',
  tileset_fireman: 'tilesets/tileset_fireman.json',
  tileset_elecman: 'tilesets/tileset_elecman.json',
  tileset_wily_castle: 'tilesets/tileset_wily_castle.json',
};

const EXTERNAL_BASE = 'assets/external/';
const FALLBACK_BASE = 'assets/';

export class AssetLoader {
  private static loaded = false;
  private static sheets: Map<string, Spritesheet> = new Map();

  static async load(): Promise<void> {
    if (this.loaded) return;
    const entries = Object.entries(SPRITE_MANIFEST);
    const loadPromises = entries.map(async ([key, relativePath]) => {
      // Try external first, then fallback
      const externalPath = EXTERNAL_BASE + relativePath;
      const fallbackPath = FALLBACK_BASE + relativePath;
      try {
        const sheet = await Promise.race([
          Assets.load(externalPath),
          new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000)),
        ]) as Spritesheet;
        this.sheets.set(key, sheet);
        return;
      } catch { /* external not found, try fallback */ }
      try {
        const sheet = await Promise.race([
          Assets.load(fallbackPath),
          new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000)),
        ]) as Spritesheet;
        this.sheets.set(key, sheet);
      } catch {
        console.warn(`Failed to load: ${key}`);
      }
    });
    await Promise.all(loadPromises);
    this.loaded = true;
  }

  static getSheet(key: string): Spritesheet | undefined {
    return this.sheets.get(key);
  }

  static getTexture(sheetKey: string, frameName: string): Texture | undefined {
    const sheet = this.sheets.get(sheetKey);
    return sheet?.textures?.[frameName];
  }

  static getAnimationTextures(sheetKey: string, animName: string): Texture[] {
    const sheet = this.sheets.get(sheetKey);
    return sheet?.animations?.[animName] ?? [];
  }

  static isLoaded(): boolean {
    return this.loaded;
  }
}
