"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useClubSettings } from "@/context/ClubSettingsContext";

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dumbbellRef = useRef<THREE.Group | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const fogRef = useRef<THREE.Fog | null>(null);
  
  const { isDark } = useTheme();
  const { isLoggedIn, userRole } = useAuth();
  const { name: clubName, heroTitle, heroSubtitle, heroImageUrl } = useClubSettings();
  const usePhoto = Boolean(heroImageUrl);

  const isAdmin =
    userRole?.toUpperCase() === "ADMIN" ||
    userRole?.toUpperCase() === "OWNER";

  useEffect(() => {
    if (usePhoto) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 7);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    
    // Initial background color based on theme
    const bgColor = isDark ? 0x000000 : 0xffffff;
    scene.background = new THREE.Color(bgColor);
    
    // Fog
    const fog = new THREE.Fog(bgColor, 5, 25);
    scene.fog = fog;
    fogRef.current = fog;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.3 : 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;
    
    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.5 : 2.5);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);
    keyLightRef.current = keyLight;
    
    const greenLight = new THREE.PointLight(0x22c55e, 3, 15);
    greenLight.position.set(-3, 2, 2);
    scene.add(greenLight);
    
    const blueLight = new THREE.PointLight(0x3b82f6, 2.5, 15);
    blueLight.position.set(3, -2, 2);
    scene.add(blueLight);
    
    // Load 3D model
    const loader = new GLTFLoader();
    
    loader.load("/models/dumbbell.glb", (gltf: GLTF) => {
      const dumbbell = gltf.scene;
      dumbbellRef.current = dumbbell;
      
      const box = new THREE.Box3().setFromObject(dumbbell);
      const size = box.getSize(new THREE.Vector3()).length();
      dumbbell.scale.setScalar(3 / size);
      dumbbell.position.sub(box.getCenter(new THREE.Vector3()));
      scene.add(dumbbell);
    }, undefined, (error) => {
      console.error("Error loading 3D model:", error);
    });
    
    let mouseX = 0;
    let mouseY = 0;
    
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);
    
    const clock = new THREE.Clock();
    let frameId: number;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      
      if (dumbbellRef.current) {
        dumbbellRef.current.rotation.y = t * 0.6;
        
        const targetX = mouseX * 3.5;
        const targetY = -mouseY * 2.5;
        dumbbellRef.current.position.x += (targetX - dumbbellRef.current.position.x) * 0.08;
        dumbbellRef.current.position.y += (targetY - dumbbellRef.current.position.y) * 0.08;
        dumbbellRef.current.position.y += Math.sin(t * 1.5) * 0.005;
        dumbbellRef.current.rotation.x += (mouseY * 0.4 - dumbbellRef.current.rotation.x) * 0.05;
        dumbbellRef.current.rotation.z += (mouseX * 0.4 - dumbbellRef.current.rotation.z) * 0.05;
      }
      
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseX * 0.5 - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (-mouseY * 0.4 - cameraRef.current.position.y) * 0.05;
        cameraRef.current.lookAt(0, 0, 0);
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [isDark, usePhoto]);

  useEffect(() => {
    if (!sceneRef.current || !fogRef.current || !keyLightRef.current || !ambientLightRef.current) return;
    const bgColor = isDark ? 0x000000 : 0xffffff;
    sceneRef.current.background = new THREE.Color(bgColor);
    fogRef.current.color.setHex(bgColor);
    keyLightRef.current.intensity = isDark ? 1.5 : 2.5;
    ambientLightRef.current.intensity = isDark ? 0.3 : 0.7;
  }, [isDark]);

  const ctaButton = (() => {
    if (!isLoggedIn) {
      return { label: "Rejoindre maintenant", href: "/user/register" };
    }
    if (isAdmin) {
      return { label: "Tableau de bord", href: "/admin" };
    }
    return { label: "Mon espace", href: "/dashboard" };
  })();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-500 bg-primary">
      {usePhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl!}
          alt={clubName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      )}

      {/* Visual overlay filter */}
      <div className={`absolute inset-0 transition-colors duration-500 z-[1] pointer-events-none ${
        usePhoto
          ? isDark ? "bg-black/60" : "bg-black/35"
          : isDark ? "bg-black/40" : "bg-white/20"
      }`} />

      {/* Text content */}
      <div className="relative z-10 text-center container mx-auto px-4 pointer-events-none">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-green-500">
          {heroTitle || clubName}
        </h1>

        <p className={`text-xl md:text-2xl mt-4 font-medium max-w-xl mx-auto ${usePhoto ? "text-white/85" : "text-secondary"}`}>
          {heroSubtitle || "L'excellence sportive dans un cadre d'exception"}
        </p>

        <Link
          href={ctaButton.href}
          className="mt-8 inline-block bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-8 py-3.5 rounded-full font-bold transition transform hover:scale-105 pointer-events-auto shadow-lg"
        >
          {ctaButton.label}
        </Link>
      </div>
    </section>
  );
}