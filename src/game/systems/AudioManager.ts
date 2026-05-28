const BGM_TRACKS: Record<string, string> = {
  title: 'assets/audio/bgm/01_title',
  stage_select: 'assets/audio/bgm/02_stage_select',
  cutman: 'assets/audio/bgm/03_cutman',
  gutsman: 'assets/audio/bgm/04_gutsman',
  iceman: 'assets/audio/bgm/05_iceman',
  bombman: 'assets/audio/bgm/06_bombman',
  fireman: 'assets/audio/bgm/07_fireman',
  elecman: 'assets/audio/bgm/08_elecman',
  boss: 'assets/audio/bgm/09_boss',
  wily_castle: 'assets/audio/bgm/10_wily_castle',
  ending: 'assets/audio/bgm/11_ending',
  gameover: 'assets/audio/bgm/12_gameover',
};

const SE_FILES: Record<string, string> = {
  shoot: 'assets/audio/se/se_shoot.wav',
  jump: 'assets/audio/se/se_jump.wav',
  land: 'assets/audio/se/se_land.wav',
  hurt: 'assets/audio/se/se_hurt.wav',
  enemy_destroy: 'assets/audio/se/se_enemy_destroy.wav',
  item_pickup: 'assets/audio/se/se_item_pickup.wav',
  hp_recover: 'assets/audio/se/se_hp_recover.wav',
  weapon_switch: 'assets/audio/se/se_weapon_switch.wav',
  boss_door: 'assets/audio/se/se_boss_door.wav',
  boss_explode: 'assets/audio/se/se_boss_explode.wav',
  oneup: 'assets/audio/se/se_1up.wav',
  death: 'assets/audio/se/se_death.wav',
  stage_start: 'assets/audio/se/se_stage_start.wav',
  weapon_get: 'assets/audio/se/se_weapon_get.wav',
  cursor: 'assets/audio/se/se_cursor.wav',
  pause: 'assets/audio/se/se_pause.wav',
};

export class AudioManager {
  private static ctx: AudioContext | null = null;
  private static bgmElement: HTMLAudioElement | null = null;
  private static seBuffers: Map<string, AudioBuffer> = new Map();
  private static bgmVolume = 0.5;
  private static seVolume = 0.7;
  private static currentBgm = '';

  static async init(): Promise<void> {
    this.ctx = new AudioContext();
    // Preload SE
    for (const [key, path] of Object.entries(SE_FILES)) {
      try {
        const res = await fetch(path);
        const buf = await res.arrayBuffer();
        const audio = await this.ctx.decodeAudioData(buf);
        this.seBuffers.set(key, audio);
      } catch {
        console.warn(`Failed to load SE: ${key}`);
      }
    }
  }

  static playSE(key: string) {
    if (!this.ctx) return;
    const buffer = this.seBuffers.get(key);
    if (!buffer) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = this.seVolume;
    source.connect(gain).connect(this.ctx.destination);
    source.start();
  }

  static playBGM(key: string, loop = true) {
    if (this.currentBgm === key) return;
    this.stopBGM();
    this.currentBgm = key;
    const basePath = BGM_TRACKS[key];
    if (!basePath) return;
    // Prefer ogg, fallback mp3
    const audio = new Audio();
    const canOgg = audio.canPlayType('audio/ogg');
    audio.src = canOgg ? `${basePath}.ogg` : `${basePath}.mp3`;
    audio.loop = loop;
    audio.volume = this.bgmVolume;
    audio.play().catch(() => {});
    this.bgmElement = audio;
  }

  static stopBGM() {
    if (this.bgmElement) {
      this.bgmElement.pause();
      this.bgmElement.src = '';
      this.bgmElement = null;
    }
    this.currentBgm = '';
  }

  static setBGMVolume(v: number) { this.bgmVolume = v; if (this.bgmElement) this.bgmElement.volume = v; }
  static setSEVolume(v: number) { this.seVolume = v; }
}
