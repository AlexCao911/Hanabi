# 🎆 花火 (Hanabi) - 日式禅意烟花

<div align="center">

**用手势召唤夜空中的艺术 | Summon art in the night sky with your hands**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-00897B)](https://mediapipe.dev)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev)

[English](#english) | [中文](#中文)

</div>

---

## 中文

### ✨ 项目简介

花火是一个融合了**手势识别**、**物理引擎**和**日式美学**的交互式烟花体验。通过摄像头捕捉你的手势，用捏合动作蓄力，释放时绽放出绚丽的烟花。支持 9 种传统日式烟花类型，每一朵都有独特的物理特性和视觉效果。

**核心特性**：
- 🖐️ **双手协作** - 支持同时检测 2 只手，创造更丰富的交互
- ⚡ **蓄力系统** - 捏合时间越长，烟花越壮观（最高 3 倍威力）
- 🎨 **9 种烟花** - 菊花、牡丹、柳树、棕榈、十字等传统日式烟花
- 🎵 **音效系统** - 发射和爆炸音效，可切换静音
- 📱 **移动端优化** - 支持触摸屏，性能优化适配手机
- 🤖 **机器人扩展** - 可连接 ESP32-S3 桌面机器人进行物理交互

### 🎮 使用方法

1. **允许摄像头权限** - 首次访问时授权摄像头
2. **伸出手掌** - 将手放在摄像头前，系统会自动识别
3. **捏合蓄力** - 食指和大拇指捏合，屏幕会出现充能效果
4. **释放绽放** - 松开手指，烟花在捏合位置爆炸
5. **双手协作** - 同时使用两只手创造更壮观的烟花秀

**快捷操作**：
- 点击/触摸屏幕 - 直接发射烟花
- 右下角状态栏 - 查看手势识别状态
- 左上角 "Test All Types" - 测试所有烟花类型

### 🎆 烟花类型

| 类型 | 日文 | 特点 |
|------|------|------|
| Chrysanthemum | 菊 | 经典球形，粒子均匀扩散 |
| Peony | 牡丹 | 大型球形，带拖尾效果 |
| Willow | 柳 | 下垂柳条状，优雅飘落 |
| Spike | 针 | 尖锐放射状，速度快 |
| Palm | 棕榈 | 向上喷射，像棕榈树 |
| Crossette | 十字 | 爆炸后分裂成多个小烟花 |
| Dahlia | 大丽花 | 多层次花瓣状 |
| Kamuro | 冠菊 | 金色拖尾，缓慢下落 |
| Brocade | 锦冠 | 闪烁金色粒子 |

### 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/yourusername/hanabi-fireworks.git
cd hanabi-fireworks

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

访问 `http://localhost:5173` 开始体验。

### 🛠️ 技术栈

- **前端框架**: React 19.2 + TypeScript
- **构建工具**: Vite 6.2
- **手势识别**: MediaPipe Hand Landmarker
- **AI 集成**: Google Generative AI
- **物理引擎**: 自研粒子系统
- **音频**: Web Audio API

### 📁 项目结构

```
hanabi-fireworks/
├── App.tsx                 # 主应用组件
├── services/
│   ├── fireworkEngine.ts   # 烟花物理引擎
│   └── audioManager.ts     # 音效管理器
├── types.ts                # TypeScript 类型定义
├── constants.ts            # 烟花配置常量
├── server/
│   └── websocket-server.js # WebSocket 服务器（机器人通信）
└── xiao-robot-firmware/    # ESP32-S3 机器人固件
    └── src/main.cpp
```

### 🤖 机器人扩展（可选）

项目支持连接 **Seeed XIAO ESP32-S3** 桌面机器人，实现物理世界的交互：

**硬件需求**：
- Seeed XIAO ESP32-S3 Sense
- VL53L0X ToF 距离传感器 × 2
- SG90 舵机 × 2-4
- WS2812B LED 灯带
- MPU6050 陀螺仪（可选）

**交互模式**：
1. **召唤师模式** - 机器人挥手触发烟花
2. **指挥家模式** - 机器人编排烟花交响乐
3. **共舞模式** - 人机同步舞蹈
4. **情绪模式** - 机器人感知情绪并表达

详见 [ROBOT_INTERACTION_DESIGN.md](./ROBOT_INTERACTION_DESIGN.md)

**启动机器人服务器**：
```bash
cd server
npm install
node websocket-server.js
```

### 🎨 设计理念

花火的设计灵感来自日本传统烟花大会（花火大会）和禅宗美学：

- **侘寂 (Wabi-Sabi)** - 接受不完美，每朵烟花都是独一无二的
- **间 (Ma)** - 留白的艺术，夜空是画布
- **幽玄 (Yūgen)** - 深邃神秘的美感
- **物哀 (Mono no Aware)** - 烟花转瞬即逝的美丽

### 📱 移动端支持

项目针对移动设备进行了优化：
- 降低摄像头分辨率（480x360）
- 跳帧检测（每 3 帧检测一次）
- 触摸屏支持
- 防止双击缩放
- CPU 模式运行（更稳定）

### 🔧 配置说明

**环境变量** (`.env.local`):
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**烟花参数调整** (`constants.ts`):
```typescript
export const FIREWORK_CONFIGS = {
  Chrysanthemum: {
    particleCount: 100,
    speed: 3,
    gravity: 0.05,
    // ...
  }
}
```

### 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 📄 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

### 🙏 致谢

- [MediaPipe](https://mediapipe.dev) - 强大的手势识别
- [React](https://react.dev) - 优雅的 UI 框架
- [Vite](https://vitejs.dev) - 极速的构建工具
- 日本传统烟花艺术 - 设计灵感来源

---

## English

### ✨ Introduction

Hanabi is an interactive firework experience that combines **gesture recognition**, **physics engine**, and **Japanese aesthetics**. Capture your hand gestures through the camera, charge by pinching, and release to bloom stunning fireworks. Supports 9 traditional Japanese firework types, each with unique physics and visual effects.

**Key Features**:
- 🖐️ **Dual-hand Support** - Detect up to 2 hands simultaneously for richer interactions
- ⚡ **Charging System** - Longer pinch = more spectacular fireworks (up to 3x power)
- 🎨 **9 Firework Types** - Chrysanthemum, Peony, Willow, Palm, Crossette, and more
- 🎵 **Sound System** - Launch and explosion sound effects with mute toggle
- 📱 **Mobile Optimized** - Touch screen support with performance tuning
- 🤖 **Robot Extension** - Connect ESP32-S3 desktop robot for physical interaction

### 🎮 How to Use

1. **Allow Camera Permission** - Grant camera access on first visit
2. **Show Your Hand** - Place hand in front of camera for auto-detection
3. **Pinch to Charge** - Pinch index finger and thumb, see charging effect
4. **Release to Bloom** - Release fingers, firework explodes at pinch position
5. **Dual-hand Collaboration** - Use both hands for spectacular shows

**Quick Actions**:
- Click/Touch screen - Launch firework directly
- Bottom-right status - Check gesture recognition status
- Top-left "Test All Types" - Test all firework types

### 🎆 Firework Types

| Type | Japanese | Characteristics |
|------|----------|-----------------|
| Chrysanthemum | 菊 | Classic sphere, uniform particle spread |
| Peony | 牡丹 | Large sphere with trailing effect |
| Willow | 柳 | Drooping willow-like, elegant fall |
| Spike | 針 | Sharp radial, high speed |
| Palm | 棕榈 | Upward spray, palm tree-like |
| Crossette | 十字 | Splits into multiple small fireworks |
| Dahlia | 大丽花 | Multi-layered petal shape |
| Kamuro | 冠菊 | Golden trail, slow descent |
| Brocade | 锦冠 | Sparkling golden particles |

### 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/hanabi-fireworks.git
cd hanabi-fireworks

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` to start.

### 🛠️ Tech Stack

- **Frontend**: React 19.2 + TypeScript
- **Build Tool**: Vite 6.2
- **Gesture Recognition**: MediaPipe Hand Landmarker
- **AI Integration**: Google Generative AI
- **Physics Engine**: Custom particle system
- **Audio**: Web Audio API

### 📁 Project Structure

```
hanabi-fireworks/
├── App.tsx                 # Main app component
├── services/
│   ├── fireworkEngine.ts   # Firework physics engine
│   └── audioManager.ts     # Audio manager
├── types.ts                # TypeScript type definitions
├── constants.ts            # Firework configuration constants
├── server/
│   └── websocket-server.js # WebSocket server (robot communication)
└── xiao-robot-firmware/    # ESP32-S3 robot firmware
    └── src/main.cpp
```

### 🤖 Robot Extension (Optional)

Connect **Seeed XIAO ESP32-S3** desktop robot for physical world interaction:

**Hardware Requirements**:
- Seeed XIAO ESP32-S3 Sense
- VL53L0X ToF distance sensor × 2
- SG90 servo × 2-4
- WS2812B LED strip
- MPU6050 gyroscope (optional)

**Interaction Modes**:
1. **Summoner Mode** - Robot gestures trigger fireworks
2. **Conductor Mode** - Robot orchestrates firework symphony
3. **Dance Mode** - Human-robot synchronized dance
4. **Emotion Mode** - Robot senses and expresses emotions

See [ROBOT_INTERACTION_DESIGN.md](./ROBOT_INTERACTION_DESIGN.md) for details.

**Start Robot Server**:
```bash
cd server
npm install
node websocket-server.js
```

### 🎨 Design Philosophy

Hanabi's design is inspired by traditional Japanese firework festivals (花火大会) and Zen aesthetics:

- **Wabi-Sabi (侘寂)** - Embrace imperfection, each firework is unique
- **Ma (間)** - Art of negative space, night sky as canvas
- **Yūgen (幽玄)** - Profound mysterious beauty
- **Mono no Aware (物哀)** - Beauty of transient fireworks

### 📱 Mobile Support

Optimized for mobile devices:
- Reduced camera resolution (480x360)
- Frame skipping (detect every 3rd frame)
- Touch screen support
- Prevent double-tap zoom
- CPU mode for stability

### 🔧 Configuration

**Environment Variables** (`.env.local`):
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**Firework Parameters** (`constants.ts`):
```typescript
export const FIREWORK_CONFIGS = {
  Chrysanthemum: {
    particleCount: 100,
    speed: 3,
    gravity: 0.05,
    // ...
  }
}
```

### 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file

### 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev) - Powerful gesture recognition
- [React](https://react.dev) - Elegant UI framework
- [Vite](https://vitejs.dev) - Lightning-fast build tool
- Traditional Japanese firework art - Design inspiration

---

<div align="center">

**Made with ❤️ and ✨**

如果这个项目对你有帮助，请给一个 ⭐️ | If this project helps you, please give it a ⭐️

</div>
