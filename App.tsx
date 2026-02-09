
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FireworkEngine } from './services/fireworkEngine';
import { AudioManager } from './services/audioManager';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { FireworkType } from './types';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FireworkEngine>(new FireworkEngine());
  const audioRef = useRef<AudioManager>(new AudioManager());
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [message, setMessage] = useState("Invoking the Spirits...");
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ fps: 0, detectionTime: 0, handsCount: 0 });
  const [showFireworkTest, setShowFireworkTest] = useState(false);
  
  // Multi-hand Charging Logic - 支持最多 2 只手
  interface HandState {
    isPinching: boolean;
    chargeStartTime: number;
    isCharging: boolean;
    chargeProgress: number;
    x: number;
    y: number;
  }
  
  const handStatesRef = useRef<Map<number, HandState>>(new Map());
  const [activeHands, setActiveHands] = useState<number[]>([]);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  // 1. Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        // 移动端优化：降低分辨率，优先使用前置摄像头
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: isMobile ? 480 : 640 }, 
            height: { ideal: isMobile ? 360 : 480 },
            facingMode: "user",
            frameRate: { ideal: isMobile ? 24 : 30 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // iOS 必需
          videoRef.current.setAttribute('webkit-playsinline', 'true'); // 旧版 iOS
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraActive(true);
            setMessage("Camera ready. Loading vision...");
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setMessage("Camera access denied. Please allow camera permission.");
      }
    };
    startCamera();
  }, []);

  // 2. Initialize MediaPipe
  const initMediaPipe = useCallback(async () => {
    try {
      console.log('Initializing MediaPipe...');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      console.log('Creating hand landmarker...');
      const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: isMobile ? "CPU" : "GPU" // 移动端使用 CPU 更稳定
        },
        runningMode: "VIDEO",
        numHands: 2, // 支持检测 2 只手
        minHandDetectionConfidence: isMobile ? 0.3 : 0.5, // 移动端降低阈值
        minHandPresenceConfidence: isMobile ? 0.3 : 0.5,
        minTrackingConfidence: isMobile ? 0.3 : 0.5
      });
      
      handLandmarkerRef.current = handLandmarker;
      setIsLoaded(true);
      setMessage(isMobile ? "Show your hand to the camera..." : "Raise your hand to the night sky...");
      console.log('MediaPipe initialized successfully!');
    } catch (err) {
      console.error("MediaPipe initialization error:", err);
      setMessage("Vision loading failed. Tap screen to launch fireworks.");
    }
  }, []);

  useEffect(() => {
    initMediaPipe();
    engineRef.current.onLaunch = () => audioRef.current.playLaunch();
    engineRef.current.onExplode = (type) => audioRef.current.playExplosion(type);
  }, [initMediaPipe]);



  const toggleSound = () => {
    const isMuted = audioRef.current.toggleMute();
    setMuted(isMuted);
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // 防止移动端双击缩放
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    engineRef.current.launch(x, y, 1.5);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleCanvasClick(e);
  };

  // 测试所有烟花类型
  const testAllFireworks = () => {
    const types: FireworkType[] = ['Chrysanthemum', 'Peony', 'Willow', 'Spike', 'Palm', 'Crossette', 'Dahlia', 'Kamuro', 'Brocade'];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    types.forEach((type, index) => {
      setTimeout(() => {
        const x = (canvas.width / (types.length + 1)) * (index + 1);
        const y = canvas.height * 0.3;
        engineRef.current.launch(x, y, 1.5, type);
      }, index * 500); // 每 0.5 秒发射一个
    });
  };

  // 3. Animation and Detection Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const engine = engineRef.current;
    engine.setCanvas(canvas);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let lastVideoTime = -1;
    let frameCount = 0;
    let lastFpsUpdate = Date.now();
    let fpsCounter = 0;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const skipFrames = isMobile ? 2 : 0; // 移动端每3帧检测一次，提升性能

    const animate = () => {
      frameCount++;
      fpsCounter++;
      
      // 更新 FPS
      if (Date.now() - lastFpsUpdate > 1000) {
        setDebugInfo(prev => ({ ...prev, fps: fpsCounter }));
        fpsCounter = 0;
        lastFpsUpdate = Date.now();
      }
      
      if (video.readyState >= 2 && handLandmarkerRef.current && (!isMobile || frameCount % (skipFrames + 1) === 0)) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== video.currentTime) {
          lastVideoTime = video.currentTime;
          try {
            const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
            const detectionTime = performance.now() - startTimeMs;
            const handsCount = results.landmarks?.length || 0;
            setDebugInfo(prev => ({ ...prev, detectionTime: Math.round(detectionTime), handsCount }));
          
          if (results.landmarks && results.landmarks.length > 0) {
            setHandDetected(true);
            const currentHandIds = new Set<number>();
            const chargingStates: Array<{ x: number; y: number; progress: number }> = [];
            
            // 处理每只检测到的手
            results.landmarks.forEach((landmarks, handIndex) => {
              currentHandIds.add(handIndex);
              
              const indexTip = landmarks[8];
              const thumbTip = landmarks[4];
              
              // Map video coords (inverted) to canvas
              const x = (1 - indexTip.x) * canvas.width;
              const y = indexTip.y * canvas.height;
              
              // 获取或创建该手的状态
              if (!handStatesRef.current.has(handIndex)) {
                handStatesRef.current.set(handIndex, {
                  isPinching: false,
                  chargeStartTime: 0,
                  isCharging: false,
                  chargeProgress: 0,
                  x: 0,
                  y: 0
                });
              }
              
              const handState = handStatesRef.current.get(handIndex)!;
              handState.x = x;
              handState.y = y;

              // Distance calculation for pinch
              const distance = Math.sqrt(
                Math.pow(indexTip.x - thumbTip.x, 2) + 
                Math.pow(indexTip.y - thumbTip.y, 2)
              );

              // 移动端放宽捏合阈值
              const pinchThreshold = isMobile ? 0.12 : 0.08;
              const isCurrentlyPinching = distance < pinchThreshold;
              
              if (frameCount % 30 === 0 && handIndex === 0) { // 减少日志频率
                console.log(`Hand ${handIndex} - Distance:`, distance.toFixed(3), 'Pinching:', isCurrentlyPinching);
              }

              if (isCurrentlyPinching) {
                if (!handState.isPinching) {
                  // START PINCH
                  handState.isPinching = true;
                  handState.chargeStartTime = Date.now();
                  handState.isCharging = true;
                }
                // UPDATE CHARGE
                const duration = (Date.now() - handState.chargeStartTime) / 1000;
                const progress = Math.min(duration / 2.0, 1.0); // 2s for max charge
                handState.chargeProgress = progress;
                chargingStates.push({ x, y, progress });
              } else {
                if (handState.isPinching) {
                  // RELEASE PINCH -> LAUNCH
                  handState.isPinching = false;
                  const duration = (Date.now() - handState.chargeStartTime) / 1000;
                  // Power scales from 0.8 (quick tap) up to 3.0 (2s hold)
                  const power = 0.8 + Math.min(duration / 2.0, 1.0) * 2.2;
                  
                  // 每次随机选择烟花类型，不限制为单一类型
                  const allFireworkTypes: FireworkType[] = ['Chrysanthemum', 'Peony', 'Willow', 'Spike', 'Palm', 'Crossette', 'Dahlia', 'Kamuro', 'Brocade'];
                  const randomType = allFireworkTypes[Math.floor(Math.random() * allFireworkTypes.length)];
                  
                  engine.launch(x, y, power, randomType);
                  handState.isCharging = false;
                  handState.chargeProgress = 0;
                }
              }
            });
            
            // 更新活跃的手的列表
            setActiveHands(Array.from(currentHandIds));
            
            // 清理不再检测到的手
            const handsToRemove: number[] = [];
            handStatesRef.current.forEach((_, handId) => {
              if (!currentHandIds.has(handId)) {
                handsToRemove.push(handId);
              }
            });
            handsToRemove.forEach(handId => handStatesRef.current.delete(handId));
            
            // 更新引擎的充能状态（支持多个）
            engine.setMultiChargingStates(chargingStates);
            
            // 设置光标位置（使用第一只手）
            if (results.landmarks.length > 0) {
              const firstHand = results.landmarks[0];
              const x = (1 - firstHand[8].x) * canvas.width;
              const y = firstHand[8].y * canvas.height;
              engine.setCursor(x, y, true);
            }
            
          } else {
            setHandDetected(false);
            setActiveHands([]);
            engine.setCursor(0, 0, false);
            // Cancel all charging if hands lost
            handStatesRef.current.clear();
            engine.setMultiChargingStates([]);
          }
          } catch (err) {
            console.error('Hand detection error:', err);
          }
        }
      }

      engine.update();
      engine.draw();
      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoaded]);

  return (
    <div className={`relative w-full h-screen bg-[#050510] overflow-hidden text-white select-none transition-all duration-1000 ${handDetected ? 'shadow-[inset_0_0_60px_rgba(255,255,255,0.05)]' : ''}`}>
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        className="absolute inset-0 z-10 cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-bold text-white/[0.01] pointer-events-none z-0 select-none">
        {activeHands.length > 1 ? '双' : '静'}
      </div>

      {/* Multi-hand Charging Pulse Visual */}
      {activeHands.some(id => handStatesRef.current.get(id)?.isCharging) && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{ 
            opacity: Math.max(...activeHands.map(id => handStatesRef.current.get(id)?.chargeProgress || 0)) * 0.15,
            boxShadow: `inset 0 0 ${Math.max(...activeHands.map(id => handStatesRef.current.get(id)?.chargeProgress || 0)) * 200}px rgba(255,255,255,0.8)`
          }}
        />
      )}

      {/* Landscape Silhouette */}
      <div className="absolute bottom-0 left-0 w-full h-1/4 z-0 pointer-events-none opacity-20">
        <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 200 L200 120 L400 180 L600 80 L800 150 L1000 100 L1000 200 Z" fill="#1a1a2e" />
            <path d="M0 200 L150 150 L350 190 L550 120 L750 170 L1000 140 L1000 200 Z" fill="#0f0f1b" />
        </svg>
      </div>

      {/* Top Left UI: Haiku & Title */}
      <div className="absolute top-12 left-12 z-20 max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-light tracking-[0.3em] text-white/90 drop-shadow-2xl">花火</h1>
          <p className="text-[10px] tracking-[0.5em] text-white/40 uppercase">Spirit of Hanabi</p>
        </div>
        <div className="h-px w-32 bg-gradient-to-r from-white/40 to-transparent"></div>
        <div className="relative">
          <p className="text-sm font-light text-white/70 leading-relaxed italic whitespace-pre-line tracking-wide">
            Deep night, silent sky,<br/>
            One spark wakes the sleeping world,<br/>
            Flowers of light bloom.
          </p>
        </div>
        
        {/* 烟花测试按钮 */}
        <button
          onClick={() => {
            setShowFireworkTest(!showFireworkTest);
            if (!showFireworkTest) testAllFireworks();
          }}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white/70 text-xs tracking-wider transition-all duration-300"
        >
          {showFireworkTest ? '✓ Testing...' : 'Test All Types'}
        </button>
      </div>

      {/* Bottom Right UI: Status */}
      <div className="absolute bottom-12 right-12 z-20 max-w-xs">
        {/* Interaction Info */}
        <div className="space-y-3 bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl min-w-[220px]">
          {!isLoaded || !cameraActive ? (
              <div className="flex items-center space-x-3 text-white/50">
                  <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                  <span className="text-xs uppercase tracking-widest">{message}</span>
              </div>
          ) : (
              <>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-1">Celestial Tracking</p>
                  <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                          <span className={`text-[11px] tracking-widest transition-colors duration-500 font-medium ${handDetected ? 'text-white' : 'text-white/20'}`}>
                              {activeHands.length > 1 ? `${activeHands.length} SOULS CONNECTED` : 
                               activeHands.some(id => handStatesRef.current.get(id)?.isCharging) ? "SPIRIT ACCUMULATING" : 
                               handDetected ? "SOUL CONNECTED" : "SEEKING GESTURE"}
                          </span>
                          <div className="flex space-x-1">
                            {activeHands.length > 0 ? (
                              activeHands.map(handId => (
                                <div 
                                  key={handId}
                                  className={`w-2 h-2 rounded-full transition-all duration-700 ${
                                    handStatesRef.current.get(handId)?.isCharging 
                                      ? 'bg-white shadow-[0_0_15px_white] scale-125' 
                                      : 'bg-white/70 shadow-[0_0_8px_white] scale-110'
                                  }`}
                                  style={{ 
                                    backgroundColor: handId === 0 ? '#FFFFFF' : '#B0C4FF'
                                  }}
                                ></div>
                              ))
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white/10 scale-90"></div>
                            )}
                          </div>
                      </div>
                      
                      {/* Multi-hand Progress Bars */}
                      {activeHands.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {activeHands.map(handId => {
                            const handState = handStatesRef.current.get(handId);
                            const isCharging = handState?.isCharging || false;
                            const progress = handState?.chargeProgress || 0;
                            return (
                              <div key={handId} className="flex items-center space-x-2">
                                <span className="text-[8px] text-white/40 w-12">
                                  {handId === 0 ? 'Hand 1' : 'Hand 2'}
                                </span>
                                <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-100 ${isCharging ? 'opacity-100' : 'opacity-20'}`}
                                    style={{ 
                                      width: `${isCharging ? progress * 100 : 100}%`,
                                      backgroundColor: handId === 0 ? '#FFFFFF' : '#B0C4FF'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                  <p className="text-[9px] text-white/40 italic leading-tight">
                    {activeHands.length > 1 ? '双手协作，共舞星空' : '捏合指尖以蓄力，释放即绽放'}<br/>
                    {activeHands.length > 1 ? 'Two hands, infinite possibilities' : 'Pinch to charge, Release to bloom'}
                  </p>
                  
                  {/* Debug Info - 仅移动端显示 */}
                  {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                    <div className="text-[8px] text-white/20 pt-2 border-t border-white/5 space-y-0.5">
                      <div>FPS: {debugInfo.fps}</div>
                      <div>Detection: {debugInfo.detectionTime}ms</div>
                      <div>Hands: {debugInfo.handsCount}</div>
                      <div>Device: Mobile</div>
                    </div>
                  )}
              </>
          )}
        </div>
      </div>

      {/* Subtle Camera Preview */}
      <video
        ref={videoRef}
        className="fixed bottom-4 left-4 w-44 h-33 rounded-xl border border-white/10 opacity-15 grayscale pointer-events-none scale-x-[-1] z-0 shadow-lg"
        playsInline
        webkit-playsinline="true"
        autoPlay
        muted
      />
    </div>
  );
};

export default App;
