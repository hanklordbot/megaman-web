# External Sprites 使用說明

本專案支援載入外部 sprite sheets，優先於內建素材顯示。
外部素材目錄已加入 `.gitignore`，不會被 commit 或公開部署。

## 目錄結構

將素材放置於 `public/assets/external/` 下對應子目錄：

```
public/assets/external/
├── sprites/
│   ├── megaman/          ← 主角 sprite sheets
│   │   ├── megaman_mega_buster.json
│   │   ├── megaman_mega_buster.png
│   │   ├── megaman_rolling_cutter.json
│   │   ├── megaman_rolling_cutter.png
│   │   ├── megaman_super_arm.json
│   │   ├── megaman_super_arm.png
│   │   ├── megaman_ice_slasher.json
│   │   ├── megaman_ice_slasher.png
│   │   ├── megaman_hyper_bomb.json
│   │   ├── megaman_hyper_bomb.png
│   │   ├── megaman_fire_storm.json
│   │   ├── megaman_fire_storm.png
│   │   ├── megaman_thunder_beam.json
│   │   └── megaman_thunder_beam.png
│   ├── bosses/           ← Boss sprite sheets
│   │   ├── cut_man.json / .png
│   │   ├── guts_man.json / .png
│   │   ├── ice_man.json / .png
│   │   ├── bomb_man.json / .png
│   │   ├── fire_man.json / .png
│   │   └── elec_man.json / .png
│   └── enemies/          ← 一般敵人 sprite sheets
│       ├── met.json / .png
│       ├── sniper_joe.json / .png
│       ├── blaster.json / .png
│       ├── flea.json / .png
│       ├── screw_bomber.json / .png
│       ├── penguin.json / .png
│       └── foot_holder.json / .png
├── tilesets/             ← 關卡 tilesets
│   ├── tileset_cutman.json / .png
│   ├── tileset_gutsman.json / .png
│   ├── tileset_iceman.json / .png
│   ├── tileset_bombman.json / .png
│   ├── tileset_fireman.json / .png
│   ├── tileset_elecman.json / .png
│   └── tileset_wily_castle.json / .png
└── ui/                   ← UI 素材
    ├── ui_sprites.json
    └── ui_sprites.png
```

## JSON Atlas 格式

使用 TexturePacker 格式（PixiJS 原生支援）：

```json
{
  "frames": {
    "frame_name.png": {
      "frame": { "x": 0, "y": 0, "w": 32, "h": 40 },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 40 },
      "sourceSize": { "w": 32, "h": 40 }
    }
  },
  "animations": {
    "idle": ["frame_idle_0.png", "frame_idle_1.png"],
    "walk": ["frame_walk_0.png", "frame_walk_1.png", "frame_walk_2.png", "frame_walk_3.png"],
    "jump": ["frame_jump_0.png", "frame_jump_1.png"],
    "shoot_stand": ["frame_shoot_stand_0.png", "frame_shoot_stand_1.png"],
    "shoot_walk": ["frame_shoot_walk_0.png", "frame_shoot_walk_1.png"],
    "shoot_jump": ["frame_shoot_jump_0.png", "frame_shoot_jump_1.png"],
    "hurt": ["frame_hurt_0.png", "frame_hurt_1.png"],
    "death": ["frame_death_0.png", "..."]
  },
  "meta": {
    "image": "megaman_mega_buster.png",
    "format": "RGBA8888",
    "size": { "w": 256, "h": 256 },
    "scale": "1"
  }
}
```

## 必要的 Animation 名稱

### 主角 (megaman_*.json)
- `idle` — 待機（2 幀）
- `walk` — 行走（4 幀）
- `jump` — 跳躍（2 幀）
- `shoot_stand` — 站立射擊（2 幀）
- `shoot_walk` — 行走射擊（4 幀）
- `shoot_jump` — 空中射擊（2 幀）
- `hurt` — 受傷（2 幀）
- `death` — 死亡（8 幀）

### Boss (*.json)
- `idle` — 待機/基本動作

### 敵人 (*.json)
- `idle` — 基本動作

## 使用方式

```bash
# 1. 將素材放到對應目錄後
# 2. 啟動開發伺服器
npm run dev

# 3. 開啟瀏覽器 http://localhost:5173/megaman-web/
```

## 載入優先順序

1. `public/assets/external/` — 優先載入（本地測試素材）
2. `public/assets/` — Fallback（內建程式生成素材）

如果 external 目錄中的素材載入失敗（檔案不存在或格式錯誤），會自動 fallback 到內建素材。

## 工具推薦

- **TexturePacker** — 將多張 PNG 打包為 sprite sheet + JSON atlas
- **Free Texture Packer** — 免費替代方案 (https://free-tex-packer.com/)
- **ShoeBox** — 免費 sprite sheet 工具
