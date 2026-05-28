import { Assets, Spritesheet, Texture } from 'pixi.js';

const SPRITE_MANIFEST = {
  megaman_mega_buster: 'assets/sprites/megaman/megaman_mega_buster.json',
  megaman_rolling_cutter: 'assets/sprites/megaman/megaman_rolling_cutter.json',
  megaman_super_arm: 'assets/sprites/megaman/megaman_super_arm.json',
  megaman_ice_slasher: 'assets/sprites/megaman/megaman_ice_slasher.json',
  megaman_hyper_bomb: 'assets/sprites/megaman/megaman_hyper_bomb.json',
  megaman_fire_storm: 'assets/sprites/megaman/megaman_fire_storm.json',
  megaman_thunder_beam: 'assets/sprites/megaman/megaman_thunder_beam.json',
  boss_cut_man: 'assets/sprites/bosses/cut_man.json',
  boss_guts_man: 'assets/sprites/bosses/guts_man.json',
  boss_ice_man: 'assets/sprites/bosses/ice_man.json',
  boss_bomb_man: 'assets/sprites/bosses/bomb_man.json',
  boss_fire_man: 'assets/sprites/bosses/fire_man.json',
  boss_elec_man: 'assets/sprites/bosses/elec_man.json',
  enemy_met: 'assets/sprites/enemies/met.json',
  enemy_sniper_joe: 'assets/sprites/enemies/sniper_joe.json',
  enemy_blaster: 'assets/sprites/enemies/blaster.json',
  enemy_flea: 'assets/sprites/enemies/flea.json',
  enemy_screw_bomber: 'assets/sprites/enemies/screw_bomber.json',
  enemy_penguin: 'assets/sprites/enemies/penguin.json',
  enemy_foot_holder: 'assets/sprites/enemies/foot_holder.json',
  ui_sprites: 'assets/ui/ui_sprites.json',
  tileset_cutman: 'assets/tilesets/tileset_cutman.json',
  tileset_gutsman: 'assets/tilesets/tileset_gutsman.json',
  tileset_iceman: 'assets/tilesets/tileset_iceman.json',
  tileset_bombman: 'assets/tilesets/tileset_bombman.json',
  tileset_fireman: 'assets/tilesets/tileset_fireman.json',
  tileset_elecman: 'assets/tilesets/tileset_elecman.json',
  tileset_wily_castle: 'assets/tilesets/tileset_wily_castle.json',
};

export class AssetLoader {
  private static loaded = false;
  private static sheets: Map<string, Spritesheet> = new Map();

  static async load(): Promise<void> {
    if (this.loaded) return;
    const entries = Object.entries(SPRITE_MANIFEST);
    for (const [key, path] of entries) {
      try {
        const sheet = await Assets.load(path) as Spritesheet;
        this.sheets.set(key, sheet);
      } catch {
        console.warn(`Failed to load: ${key} (${path})`);
      }
    }
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
