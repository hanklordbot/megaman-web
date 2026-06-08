import { Assets, Spritesheet, Texture, BaseTexture, Rectangle } from 'pixi.js';

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

const FALLBACK_BASE = 'assets/';

export interface ItemFrame { name: string; x: number; y: number; w: number; h: number }
export interface HudElements { [key: string]: { x: number; y: number; w: number; h: number } }
export interface StageSelectPortrait { boss: string; x: number; y: number; w: number; h: number }

export class AssetLoader {
  private static loaded = false;
  private static sheets: Map<string, Spritesheet> = new Map();
  private static itemFrames: ItemFrame[] = [];
  private static itemBaseTexture: BaseTexture | null = null;
  private static hudElements: HudElements = {};
  private static hudBaseTexture: BaseTexture | null = null;
  private static stageSelectPortraits: StageSelectPortrait[] = [];
  private static stageSelectBaseTexture: BaseTexture | null = null;
  private static titleTexture: Texture | null = null;

  static async load(): Promise<void> {
    if (this.loaded) return;

    // Load standard spritesheets
    const entries = Object.entries(SPRITE_MANIFEST);
    await Promise.all(entries.map(async ([key, relativePath]) => {
      const path = FALLBACK_BASE + relativePath;
      try {
        const sheet = await Promise.race([
          Assets.load(path),
          new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000)),
        ]) as Spritesheet;
        this.sheets.set(key, sheet);
      } catch {
        console.warn(`Failed to load: ${key}`);
      }
    }));

    // Load custom items spritesheet
    await this.loadItems();
    // Load HUD elements
    await this.loadHud();
    // Load stage select portraits
    await this.loadStageSelect();
    // Load title screen
    await this.loadTitle();

    this.loaded = true;
  }

  private static async loadItems(): Promise<void> {
    try {
      const res = await fetch(FALLBACK_BASE + 'items/items_spritesheet.json');
      const data = await res.json();
      this.itemFrames = data.items ?? [];
      this.itemBaseTexture = BaseTexture.from(FALLBACK_BASE + 'items/items_spritesheet.png');
    } catch { console.warn('Failed to load items spritesheet'); }
  }

  private static async loadHud(): Promise<void> {
    try {
      const res = await fetch(FALLBACK_BASE + 'ui/hud_elements.json');
      const data = await res.json();
      this.hudElements = data.elements ?? {};
      this.hudBaseTexture = BaseTexture.from(FALLBACK_BASE + 'ui/hud_elements.png');
    } catch { console.warn('Failed to load hud_elements'); }
  }

  private static async loadStageSelect(): Promise<void> {
    try {
      const res = await fetch(FALLBACK_BASE + 'ui/stage_select.json');
      const data = await res.json();
      this.stageSelectPortraits = data.portraits ?? [];
      this.stageSelectBaseTexture = BaseTexture.from(FALLBACK_BASE + 'ui/stage_select.png');
    } catch { console.warn('Failed to load stage_select'); }
  }

  private static async loadTitle(): Promise<void> {
    try {
      this.titleTexture = await Assets.load(FALLBACK_BASE + 'ui/title_screen.png') as Texture;
    } catch { console.warn('Failed to load title_screen'); }
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

  static getItemTexture(name: string): Texture | null {
    if (!this.itemBaseTexture) return null;
    const frame = this.itemFrames.find(f => f.name === name);
    if (!frame) return null;
    return new Texture(this.itemBaseTexture, new Rectangle(frame.x, frame.y, frame.w, frame.h));
  }

  static getHudTexture(name: string): Texture | null {
    if (!this.hudBaseTexture) return null;
    const el = this.hudElements[name];
    if (!el) return null;
    return new Texture(this.hudBaseTexture, new Rectangle(el.x, el.y, el.w, el.h));
  }

  static getStageSelectPortrait(bossShort: string): Texture | null {
    if (!this.stageSelectBaseTexture) return null;
    const p = this.stageSelectPortraits.find(pp => pp.boss === bossShort);
    if (!p) return null;
    return new Texture(this.stageSelectBaseTexture, new Rectangle(p.x, p.y, p.w, p.h));
  }

  static getTitleTexture(): Texture | null {
    return this.titleTexture;
  }

  static isLoaded(): boolean {
    return this.loaded;
  }
}
