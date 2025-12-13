import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  isPulsing: boolean;
}

export function NetworkMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      const nodeCount = Math.floor((canvas.width * canvas.height) / 15000);
      nodesRef.current = [];
      
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          pulsePhase: Math.random() * Math.PI * 2,
          isPulsing: Math.random() < 0.1,
        });
      }
    };

    const drawNode = (node: Node, time: number) => {
      const pulse = node.isPulsing ? Math.sin(time * 0.003 + node.pulsePhase) * 0.5 + 1 : 1;
      const radius = node.radius * pulse;
      
      // Glow effect
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 4);
      gradient.addColorStop(0, 'hsla(142, 100%, 50%, 0.8)');
      gradient.addColorStop(0.5, 'hsla(142, 100%, 50%, 0.2)');
      gradient.addColorStop(1, 'hsla(142, 100%, 50%, 0)');
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Core node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(142, 100%, 50%)';
      ctx.fill();
    };

    const drawConnection = (node1: Node, node2: Node, distance: number, maxDistance: number) => {
      const opacity = (1 - distance / maxDistance) * 0.6;
      
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(node2.x, node2.y);
      ctx.strokeStyle = `hsla(142, 100%, 50%, ${opacity})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    const updateNodes = () => {
      nodesRef.current.forEach(node => {
        // Mouse interaction
        const dx = mouseRef.current.x - node.x;
        const dy = mouseRef.current.y - node.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        
        if (distToMouse < 150) {
          const force = (150 - distToMouse) / 150 * 0.02;
          node.vx -= (dx / distToMouse) * force;
          node.vy -= (dy / distToMouse) * force;
        }
        
        // Update position
        node.x += node.vx;
        node.y += node.vy;
        
        // Boundary bounce
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        
        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
        
        // Damping
        node.vx *= 0.999;
        node.vy *= 0.999;
        
        // Random pulse toggle
        if (Math.random() < 0.001) {
          node.isPulsing = !node.isPulsing;
        }
      });
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const maxDistance = 150;
      const nodes = nodesRef.current;
      
      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            drawConnection(nodes[i], nodes[j], distance, maxDistance);
          }
        }
      }
      
      // Draw nodes
      nodes.forEach(node => drawNode(node, time));
      
      updateNodes();
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}

