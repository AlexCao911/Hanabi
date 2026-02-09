
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FireworkEngine } from './services/fireworkEngine';
import { AudioManager } from './services/audioManager';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

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
  
  // Charging Logic
  const isPinchingRef = useRef(false);
  const chargeStartTimeRef = useRef(0);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  // 1. Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: "user" 
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraActive(true);
            setMessage("Camera ready. Loading vision...");
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setMessage("Camera access denied.");
      }
    };
    startCamera();
  }, []);

  // 2. Initialize MediaPipe
  const initMediaPipe = useCallback(async () => {
    try {
      console.log('Initializing MediaPipe...');
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      console.log('Creating hand landmarker...');
      const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      
      handLandmarkerRef.current = handLandmarker;
      setIsLoaded(true);
      setMessage("Raise your hand to the night sky...");
      console.log('MediaPipe initialized successfully!');
    } catch (err) {
      console.error("MediaPipe initialization error:", err);
      setMessage("Vision loading failed. Check console.");
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    engineRef.current.launch(x, y, 1.5);
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
    const animate = () => {
      if (video.readyState >= 2 && handLandmarkerRef.current) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== video.currentTime) {
          lastVideoTime = video.currentTime;
          const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
          
          if (results.landmarks && results.landmarks.length > 0) {
            setHandDetected(true);
            const landmarks = results.landmarks[0];
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            
            // Map video coords (inverted) to canvas
            const x = (1 - indexTip.x) * canvas.width;
            const y = indexTip.y * canvas.height;
            engine.setCursor(x, y, true);
            
            console.log('Hand detected at:', x, y);

            // Distance calculation for pinch
            const distance = Math.sqrt(
              Math.pow(indexTip.x - thumbTip.x, 2) + 
              Math.pow(indexTip.y - thumbTip.y, 2)
            );

            const isCurrentlyPinching = distance < 0.08;
            
            console.log('Distance:', distance, 'Pinching:', isCurrentlyPinching);

            if (isCurrentlyPinching) {
              if (!isPinchingRef.current) {
                // START PINCH
                isPinchingRef.current = true;
                chargeStartTimeRef.current = Date.now();
                setIsCharging(true);
              }
              // UPDATE CHARGE
              const duration = (Date.now() - chargeStartTimeRef.current) / 1000;
              const progress = Math.min(duration / 2.0, 1.0); // 2s for max charge
              setChargeProgress(progress);
              engine.setChargingState(x, y, progress, true);
            } else {
              if (isPinchingRef.current) {
                // RELEASE PINCH -> LAUNCH
                isPinchingRef.current = false;
                const duration = (Date.now() - chargeStartTimeRef.current) / 1000;
                // Power scales from 0.8 (quick tap) up to 3.0 (2s hold)
                const power = 0.8 + Math.min(duration / 2.0, 1.0) * 2.2;
                engine.launch(x, y, power);
                engine.setChargingState(0, 0, 0, false);
                setIsCharging(false);
                setChargeProgress(0);
              }
            }
          } else {
            setHandDetected(false);
            engine.setCursor(0, 0, false);
            // Cancel charging if hand lost
            if (isPinchingRef.current) {
              isPinchingRef.current = false;
              setIsCharging(false);
              engine.setChargingState(0, 0, 0, false);
            }
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
        className="absolute inset-0 z-10 cursor-crosshair"
      />

      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-bold text-white/[0.01] pointer-events-none z-0 select-none">
        静
      </div>

      {/* Charging Pulse Visual */}
      {isCharging && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{ 
            opacity: chargeProgress * 0.15,
            boxShadow: `inset 0 0 ${chargeProgress * 200}px rgba(255,255,255,0.8)`
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
      </div>

      {/* Bottom Right UI: Status */}
      <div className="absolute bottom-12 right-12 z-20">
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
                              {isCharging ? "SPIRIT ACCUMULATING" : handDetected ? "SOUL CONNECTED" : "SEEKING GESTURE"}
                          </span>
                          <div className={`w-2 h-2 rounded-full transition-all duration-700 ${handDetected ? 'bg-white shadow-[0_0_15px_white] scale-125' : 'bg-white/10 scale-90'}`}></div>
                      </div>
                      
                      {/* Interaction Progress Bar */}
                      <div className="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-white transition-all duration-100 ${isCharging ? 'opacity-100' : 'opacity-20'}`} 
                          style={{ width: `${isCharging ? chargeProgress * 100 : handDetected ? 100 : 0}%` }}
                        ></div>
                      </div>
                  </div>
                  <p className="text-[9px] text-white/40 italic leading-tight">
                    捏合指尖以蓄力，释放即绽放<br/>
                    Pinch to charge, Release to bloom
                  </p>
              </>
          )}
        </div>
      </div>

      {/* Subtle Camera Preview */}
      <video
        ref={videoRef}
        className="fixed bottom-4 left-4 w-44 h-33 rounded-xl border border-white/10 opacity-15 grayscale pointer-events-none scale-x-[-1] z-0 shadow-lg"
        playsInline
        muted
      />
    </div>
  );
};

export default App;
