"use client"
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimation() {
  const canvasRef = useRef(null);
  const loadingScreenRef = useRef(null);
  const progressTextRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const imagesRef = useRef([]);
  const frameRef = useRef({
    currentIndex: 1,
    maxIndex: 1488,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const progressText = progressTextRef.current;

    function loadImage(index) {
      if (index >= 1 && index < imagesRef.current.length && imagesRef.current[index]) {
        const img = imagesRef.current[index];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const scale = Math.max(
          canvas.width / img.width,
          canvas.height / img.height
        );

        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img, 
          0, 0, img.width, img.height, 
          x, y, img.width * scale, img.height * scale
        );
      }
    }

    function startAnimation() {
      gsap.to(frameRef.current, {
        currentIndex: frameRef.current.maxIndex - 1,
        scrollTrigger: {
          trigger: ".parent",
          start: "top top",
          end: "bottom bottom",
          scrub: 2,
        },
        onUpdate: () => {
          loadImage(Math.floor(frameRef.current.currentIndex));
        }
      });
    }

    async function preLoadImages() {
      const batchSize = 10;
      let loadedCount = 0;
      
      // Initialize array with null values
      imagesRef.current = Array(frameRef.current.maxIndex).fill(null);
      
      function updateProgress() {
        const progress = Math.floor((loadedCount / frameRef.current.maxIndex) * 100);
        if (progressTextRef.current) {
          progressTextRef.current.textContent = `${progress}%`;
        }
      }
      
      async function loadBatch(startIndex) {
        const endIndex = Math.min(startIndex + batchSize, frameRef.current.maxIndex);
        
        const promises = [];
        
        for (let i = startIndex; i < endIndex; i++) {
          const imageUrl = `/frames/frame_${i.toString().padStart(4, "0")}.jpeg`;
          const img = new Image();
          
          const promise = new Promise((resolve) => {
            img.onload = () => {
              imagesRef.current[i] = img;
              loadedCount++;
              updateProgress();
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load image: ${imageUrl}`);
              loadedCount++;
              updateProgress();
              resolve();
            };
          });
          
          img.src = imageUrl;
          promises.push(promise);
        }
        
        await Promise.all(promises);
        
        if (loadedCount >= frameRef.current.maxIndex) {
          setIsLoading(false);
          loadImage(frameRef.current.currentIndex);
          startAnimation();
        } else {
          // Load next batch immediately
          loadBatch(endIndex);
        }
      }
      
      // Start loading from index 0
      loadBatch(0);
    }

    const handleResize = () => {
      if (imagesRef.current.length > 0) {
        loadImage(Math.floor(frameRef.current.currentIndex));
      }
    };

    preLoadImages();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <>
      {/* Loading Screen */}
      <div 
        ref={loadingScreenRef}
        className={`fixed top-0 left-0 w-full h-full bg-zinc-900 flex flex-col justify-center items-center z-60 transition-opacity duration-500 ${
          isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-12 h-12 border-4 border-opacity-10 border-white rounded-full border-t-white animate-spin mb-5"></div>
        <div className="text-white text-xl mb-2">Loading animation...</div>
        <div ref={progressTextRef} className="text-white text-lg mt-2">0%</div>
      </div>

      {/* Main Content */}
      <div className="bg-zinc-900 w-full">
        <div className="w-full parent h-[300vh]">
          <p className="text-[10vw] fixed z-50 text-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-screen text-center font-black">
            JUST SCROLL
          </p>
          <div className="w-full fixed top-0 left-0 h-screen">
            <canvas ref={canvasRef} className="w-screen h-screen" />
          </div>
        </div>
      </div>
    </>
  );
}