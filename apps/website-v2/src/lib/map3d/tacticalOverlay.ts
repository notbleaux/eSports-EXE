/**
 * Tactical Overlay 3D for SpecMap
 * 
 * [Ver001.000] - 3D tactical visualization overlays
 * 
 * Provides:
 * - 3D position visualization for agents/players
 * - Trajectory rendering (grenades, bullets, movement)
 * - Zone highlighting (bombsites, control areas)
 * - Smoke/flash/molly visualization
 * - Ability range indicators
 * - Vision cone rendering
 * 
 * @example
 * ```typescript
 * import { TacticalOverlay3D } from '@/lib/map3d/tacticalOverlay';
 * 
 * const overlay = new TacticalOverlay3D(scene);
 * overlay.addPlayerPosition(playerId, position, team);
 * overlay.addTrajectory(trajectoryPoints, 'grenade');
 * overlay.highlightZone('a-site', 0xff0000);
 * ```
 */

import * as THREE from 'three';

// ============================================
// Types
// ============================================

export type OverlayType = 'position' | 'trajectory' | 'zone' | 'utility' | 'vision';
export type UtilityType = 'smoke' | 'flash' | 'molly' | 'grenade' | 'decoy';
export type TeamSide = 'attacker' | 'defender' | 'spectator';

export interface PlayerPosition {
  id: string;
  name: string;
  agent: string;
  team: TeamSide;
  position: THREE.Vector3;
  rotation: number;
  health: number;
  shield: number;
  isAlive: boolean;
  isSpotted: boolean;
}

export interface TrajectoryPoint {
  position: THREE.Vector3;
  timestamp: number;
  velocity?: THREE.Vector3;
}

export interface TrajectoryConfig {
  points: TrajectoryPoint[];
  type: 'grenade' | 'bullet' | 'movement' | 'ability';
  color: number;
  width: number;
  fadeTime?: number;
  showArrows?: boolean;
}

export interface ZoneConfig {
  id: string;
  name: string;
  type: 'bombsite' | 'control' | 'chokepoint' | 'area';
  bounds: THREE.Box3;
  color: number;
  opacity: number;
  pulse?: boolean;
}

export interface UtilityConfig {
  id: string;
  type: UtilityType;
  position: THREE.Vector3;
  radius: number;
  duration: number;
  team: TeamSide;
  ownerId?: string;
}

export interface VisionConeConfig {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  angle: number;
  distance: number;
  color: number;
  opacity: number;
}

export interface OverlayStats {
  playerCount: number;
  activeTrajectories: number;
  activeZones: number;
  activeUtilities: number;
  drawCalls: number;
}

// ============================================
// Tactical Overlay 3D
// ============================================

export class TacticalOverlay3D {
  private scene: THREE.Scene;
  private playerMeshes: Map<string, THREE.Group> = new Map();
  private trajectories: Map<string, THREE.Line> = new Map();
  private zones: Map<string, THREE.Mesh> = new Map();
  private utilities: Map<string, THREE.Group> = new Map();
  private visionCones: Map<string, THREE.Mesh> = new Map();
  private labels: Map<string, THREE.Sprite> = new Map();

  // Materials cache
  private materials: Map<string, THREE.Material> = new Map();
  private geometries: Map<string, THREE.BufferGeometry> = new Map();

  // Team colors
  private teamColors: Record<TeamSide, number> = {
    attacker: 0xff4757,
    defender: 0x3742fa,
    spectator: 0x747d8c,
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeMaterials();
    this.initializeGeometries();
  }

  /**
   * Initialize shared materials
   */
  private initializeMaterials(): void {
    // Player materials
    this.materials.set(
      'player-attacker',
      new THREE.MeshBasicMaterial({ color: this.teamColors.attacker })
    );
    this.materials.set(
      'player-defender',
      new THREE.MeshBasicMaterial({ color: this.teamColors.defender })
    );

    // Utility materials
    this.materials.set(
      'smoke',
      new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
    );
    this.materials.set(
      'flash',
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      })
    );
    this.materials.set(
      'molly',
      new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        transparent: true,
        opacity: 0.7,
      })
    );

    // Zone materials
    this.materials.set(
      'zone-bombsite',
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );

    // Vision cone material
    this.materials.set(
      'vision-cone',
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
  }

  /**
   * Initialize shared geometries
   */
  private initializeGeometries(): void {
    // Player marker (cylinder with arrow)
    this.geometries.set('player-body', new THREE.CylinderGeometry(2, 2, 1, 16));
    this.geometries.set(
      'player-arrow',
      new THREE.ConeGeometry(1, 2, 8)
    );

    // Utility geometries
    this.geometries.set('smoke-sphere', new THREE.SphereGeometry(1, 32, 32));
    this.geometries.set('flash-sphere', new THREE.SphereGeometry(1, 16, 16));
    this.geometries.set('molly-cylinder', new THREE.CylinderGeometry(1, 1, 0.5, 32));

    // Zone geometry (box outline)
    this.geometries.set('zone-box', new THREE.BoxGeometry(1, 1, 1));
  }

  // ============================================
  // Player Position Visualization
  // ============================================

  /**
   * Add or update player position
   */
  addPlayerPosition(player: PlayerPosition): void {
    let group = this.playerMeshes.get(player.id);

    if (!group) {
      group = this.createPlayerMarker(player);
      this.playerMeshes.set(player.id, group);
      this.scene.add(group);
    }

    // Update position
    group.position.copy(player.position);
    group.rotation.y = (player.rotation * Math.PI) / 180;
    group.visible = player.isAlive;

    // Update color based on team
    const bodyMesh = group.getObjectByName('body') as THREE.Mesh;
    if (bodyMesh) {
      const material = this.materials.get(`player-${player.team}`);
      if (material) {
        bodyMesh.material = material;
      }
    }

    // Update health indicator
    this.updateHealthIndicator(group, player.health);

    // Update spotted state
    if (player.isSpotted) {
      this.addSpottedEffect(player.id, player.position);
    }

    // Update label
    this.updatePlayerLabel(player);
  }

  /**
   * Create player marker mesh
   */
  private createPlayerMarker(player: PlayerPosition): THREE.Group {
    const group = new THREE.Group();
    group.name = `player-${player.id}`;

    // Body (cylinder)
    const bodyGeo = this.geometries.get('player-body')!;
    const bodyMat = this.materials.get(`player-${player.team}`)!.clone();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.name = 'body';
    body.position.y = 0.5;
    group.add(body);

    // Direction arrow (cone)
    const arrowGeo = this.geometries.get('player-arrow')!;
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.name = 'arrow';
    arrow.position.set(0, 0.5, 3);
    arrow.rotation.x = Math.PI / 2;
    group.add(arrow);

    // Health ring
    const ringGeo = new THREE.RingGeometry(2.5, 3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2ed573,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'health-ring';
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);

    // Selection circle
    const circleGeo = new THREE.CircleGeometry(3.5, 32);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.name = 'selection-circle';
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.05;
    group.add(circle);

    return group;
  }

  /**
   * Update health indicator
   */
  private updateHealthIndicator(group: THREE.Group, health: number): void {
    const ring = group.getObjectByName('health-ring') as THREE.Mesh;
    if (ring && ring.material instanceof THREE.MeshBasicMaterial) {
      // Change color based on health
      if (health > 50) {
        ring.material.color.setHex(0x2ed573);
      } else if (health > 25) {
        ring.material.color.setHex(0xffa502);
      } else {
        ring.material.color.setHex(0xff4757);
      }

      // Scale based on health percentage
      const scale = 0.5 + (health / 100) * 0.5;
      ring.scale.setScalar(scale);
    }
  }

  /**
   * Update player label
   */
  private updatePlayerLabel(player: PlayerPosition): void {
    let sprite = this.labels.get(player.id);

    if (!sprite) {
      sprite = this.createTextSprite(player.name);
      sprite.name = `label-${player.id}`;
      this.labels.set(player.id, sprite);
      this.scene.add(sprite);
    }

    sprite.position.copy(player.position).add(new THREE.Vector3(0, 5, 0));
    sprite.visible = player.isAlive;
  }

  /**
   * Create text sprite for labels
   */
  private createTextSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);

    return sprite;
  }

  /**
   * Remove player position
   */
  removePlayerPosition(playerId: string): void {
    const group = this.playerMeshes.get(playerId);
    if (group) {
      this.scene.remove(group);
      this.playerMeshes.delete(playerId);
    }

    const label = this.labels.get(playerId);
    if (label) {
      this.scene.remove(label);
      label.material.map?.dispose();
      label.material.dispose();
      this.labels.delete(playerId);
    }
  }

  /**
   * Add spotted effect
   */
  private addSpottedEffect(playerId: string, position: THREE.Vector3): void {
    // Create pulsing ring effect
    const geometry = new THREE.RingGeometry(3, 4, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    ring.position.y = 0.2;

    this.scene.add(ring);

    // Animate and remove
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 1000;

      if (progress < 1) {
        const scale = 1 + progress * 2;
        ring.scale.setScalar(scale);
        material.opacity = 0.5 * (1 - progress);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(ring);
        geometry.dispose();
        material.dispose();
      }
    };
    animate();
  }

  // ============================================
  // Trajectory Rendering
  // ============================================

  /**
   * Add trajectory visualization
   */
  addTrajectory(id: string, config: TrajectoryConfig): void {
    // Remove existing trajectory
    this.removeTrajectory(id);

    // Create curve from points
    const positions = config.points.map((p) => p.position);
    const curve = new THREE.CatmullRomCurve3(positions);
    const points = curve.getPoints(100);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: config.color,
      linewidth: config.width,
      transparent: true,
      opacity: 0.8,
    });

    const line = new THREE.Line(geometry, material);
    line.name = `trajectory-${id}`;
    this.trajectories.set(id, line);
    this.scene.add(line);

    // Add arrow at end if requested
    if (config.showArrows && positions.length > 1) {
      this.addTrajectoryArrow(id, positions[positions.length - 2], positions[positions.length - 1], config.color);
    }

    // Auto-remove after fade time
    if (config.fadeTime) {
      setTimeout(() => this.removeTrajectory(id), config.fadeTime);
    }
  }

  /**
   * Add arrow at end of trajectory
   */
  private addTrajectoryArrow(
    id: string,
    from: THREE.Vector3,
    to: THREE.Vector3,
    color: number
  ): void {
    const direction = new THREE.Vector3().subVectors(to, from).normalize();
    const arrowGeo = new THREE.ConeGeometry(1, 3, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);

    arrow.position.copy(to);
    arrow.lookAt(to.clone().add(direction));
    arrow.rotateX(Math.PI / 2);

    arrow.name = `trajectory-arrow-${id}`;
    this.scene.add(arrow);
  }

  /**
   * Remove trajectory
   */
  removeTrajectory(id: string): void {
    const line = this.trajectories.get(id);
    if (line) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      this.trajectories.delete(id);
    }

    // Remove arrow if exists
    const arrow = this.scene.getObjectByName(`trajectory-arrow-${id}`);
    if (arrow) {
      this.scene.remove(arrow);
    }
  }

  /**
   * Clear all trajectories
   */
  clearTrajectories(): void {
    this.trajectories.forEach((line, id) => {
      this.removeTrajectory(id);
    });
  }

  // ============================================
  // Zone Highlighting
  // ============================================

  /**
   * Highlight zone
   */
  highlightZone(config: ZoneConfig): void {
    this.removeZone(config.id);

    const size = new THREE.Vector3();
    config.bounds.getSize(size);
    const center = new THREE.Vector3();
    config.bounds.getCenter(center);

    // Create zone mesh
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.name = `zone-${config.id}`;

    // Add wireframe outline
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: config.color,
      linewidth: 2,
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(wireframe);

    // Add pulsing animation if requested
    if (config.pulse) {
      (mesh as any).pulseStartTime = Date.now();
      (mesh as any).pulseOriginalOpacity = config.opacity;
    }

    this.zones.set(config.id, mesh);
    this.scene.add(mesh);
  }

  /**
   * Remove zone highlight
   */
  removeZone(zoneId: string): void {
    const mesh = this.zones.get(zoneId);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.zones.delete(zoneId);
    }
  }

  /**
   * Clear all zones
   */
  clearZones(): void {
    this.zones.forEach((mesh, id) => {
      this.removeZone(id);
    });
  }

  // ============================================
  // Utility Visualization
  // ============================================

  /**
   * Add utility effect (smoke, flash, molly)
   */
  addUtility(config: UtilityConfig): void {
    this.removeUtility(config.id);

    const group = new THREE.Group();
    group.name = `utility-${config.id}`;
    group.position.copy(config.position);

    switch (config.type) {
      case 'smoke':
        this.createSmokeEffect(group, config);
        break;
      case 'flash':
        this.createFlashEffect(group, config);
        break;
      case 'molly':
        this.createMollyEffect(group, config);
        break;
      case 'grenade':
        this.createGrenadeEffect(group, config);
        break;
      case 'decoy':
        this.createDecoyEffect(group, config);
        break;
    }

    this.utilities.set(config.id, group);
    this.scene.add(group);

    // Auto-remove after duration
    if (config.duration > 0) {
      setTimeout(() => this.removeUtility(config.id), config.duration * 1000);
    }
  }

  /**
   * Create smoke effect
   */
  private createSmokeEffect(group: THREE.Group, config: UtilityConfig): void {
    const geometry = this.geometries.get('smoke-sphere')!;
    const material = (this.materials.get('smoke') as THREE.MeshBasicMaterial).clone();
    const sphere = new THREE.Mesh(geometry, material);
    sphere.scale.setScalar(config.radius);
    sphere.name = 'smoke-sphere';

    // Add inner core
    const coreGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.name = 'smoke-core';

    group.add(sphere);
    group.add(core);

    // Add particle effect
    this.addSmokeParticles(group, config.radius);
  }

  /**
   * Add smoke particles
   */
  private addSmokeParticles(group: THREE.Group, radius: number): void {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = radius * (0.5 + Math.random() * 0.5);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 2,
      transparent: true,
      opacity: 0.4,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'smoke-particles';
    group.add(particles);

    // Animate particles
    const animate = () => {
      if (!group.parent) return; // Stop if removed

      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.05; // Rise up
        if (positions[i * 3 + 1] > radius) {
          positions[i * 3 + 1] = -radius;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Create flash effect
   */
  private createFlashEffect(group: THREE.Group, config: UtilityConfig): void {
    const geometry = this.geometries.get('flash-sphere')!;
    const material = (this.materials.get('flash') as THREE.MeshBasicMaterial).clone();
    const sphere = new THREE.Mesh(geometry, material);
    sphere.scale.setScalar(config.radius);
    sphere.name = 'flash-sphere';

    // Add flash burst
    const burstGeo = new THREE.SphereGeometry(1, 16, 16);
    const burstMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.5,
    });
    const burst = new THREE.Mesh(burstGeo, burstMat);
    burst.name = 'flash-burst';

    group.add(sphere);
    group.add(burst);

    // Flash animation
    const startTime = Date.now();
    const animate = () => {
      if (!group.parent) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 200, 1);

      burst.scale.setScalar(1 + progress * 5);
      burstMat.opacity = 0.5 * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        group.remove(burst);
        burstGeo.dispose();
        burstMat.dispose();
      }
    };
    animate();
  }

  /**
   * Create molly effect
   */
  private createMollyEffect(group: THREE.Group, config: UtilityConfig): void {
    const geometry = this.geometries.get('molly-cylinder')!;
    const material = (this.materials.get('molly') as THREE.MeshBasicMaterial).clone();
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.scale.set(config.radius, 1, config.radius);
    cylinder.name = 'molly-fire';

    // Add fire particles
    this.addFireParticles(group, config.radius);

    group.add(cylinder);
  }

  /**
   * Add fire particles
   */
  private addFireParticles(group: THREE.Group, radius: number): void {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;

      positions[i * 3] = r * Math.cos(angle);
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = r * Math.sin(angle);

      // Orange to red colors
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'fire-particles';
    group.add(particles);

    // Animate fire
    const animate = () => {
      if (!group.parent) return;

      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.1; // Rise
        if (positions[i * 3 + 1] > 5) {
          positions[i * 3 + 1] = 0;
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius;
          positions[i * 3] = r * Math.cos(angle);
          positions[i * 3 + 2] = r * Math.sin(angle);
        }
      }
      geometry.attributes.position.needsUpdate = true;
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Create grenade effect
   */
  private createGrenadeEffect(group: THREE.Group, config: UtilityConfig): void {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'grenade-mesh';

    group.add(sphere);
  }

  /**
   * Create decoy effect
   */
  private createDecoyEffect(group: THREE.Group, config: UtilityConfig): void {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'decoy-mesh';

    // Pulsing ring
    const ringGeo = new THREE.RingGeometry(1, 1.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.name = 'decoy-ring';

    group.add(sphere);
    group.add(ring);

    // Animate ring
    const animate = () => {
      if (!group.parent) return;
      const time = Date.now() / 1000;
      ring.scale.setScalar(1 + Math.sin(time * 5) * 0.2);
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Remove utility effect
   */
  removeUtility(utilityId: string): void {
    const group = this.utilities.get(utilityId);
    if (group) {
      // Dispose all children
      group.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });

      this.scene.remove(group);
      this.utilities.delete(utilityId);
    }
  }

  /**
   * Clear all utilities
   */
  clearUtilities(): void {
    this.utilities.forEach((group, id) => {
      this.removeUtility(id);
    });
  }

  // ============================================
  // Vision Cone Rendering
  // ============================================

  /**
   * Add vision cone
   */
  addVisionCone(id: string, config: VisionConeConfig): void {
    this.removeVisionCone(id);

    const geometry = new THREE.ConeGeometry(
      config.distance * Math.tan(config.angle / 2),
      config.distance,
      32,
      1,
      true
    );

    const material = (this.materials.get('vision-cone') as THREE.MeshBasicMaterial).clone();
    material.color.setHex(config.color);
    material.opacity = config.opacity;

    const cone = new THREE.Mesh(geometry, material);
    cone.name = `vision-${id}`;

    // Position and orient cone
    cone.position.copy(config.origin);
    cone.lookAt(config.origin.clone().add(config.direction));
    cone.rotateX(Math.PI / 2);
    cone.position.add(config.direction.clone().multiplyScalar(config.distance / 2));

    this.visionCones.set(id, cone);
    this.scene.add(cone);
  }

  /**
   * Remove vision cone
   */
  removeVisionCone(id: string): void {
    const cone = this.visionCones.get(id);
    if (cone) {
      this.scene.remove(cone);
      cone.geometry.dispose();
      (cone.material as THREE.Material).dispose();
      this.visionCones.delete(id);
    }
  }

  /**
   * Clear all vision cones
   */
  clearVisionCones(): void {
    this.visionCones.forEach((cone, id) => {
      this.removeVisionCone(id);
    });
  }

  // ============================================
  // Global Updates
  // ============================================

  /**
   * Update all overlays (call in animation loop)
   */
  update(deltaTime: number): void {
    // Update zone pulsing
    this.zones.forEach((mesh) => {
      if ((mesh as any).pulseStartTime) {
        const elapsed = (Date.now() - (mesh as any).pulseStartTime) / 1000;
        const originalOpacity = (mesh as any).pulseOriginalOpacity;
        const pulse = Math.sin(elapsed * 3) * 0.3 + 0.7;
        (mesh.material as THREE.MeshBasicMaterial).opacity = originalOpacity * pulse;
      }
    });

    // Update utilities (rotations, etc.)
    this.utilities.forEach((group) => {
      const smokeCore = group.getObjectByName('smoke-core');
      if (smokeCore) {
        smokeCore.rotation.y += deltaTime * 0.5;
      }
    });
  }

  /**
   * Clear all overlays
   */
  clearAll(): void {
    this.clearPlayers();
    this.clearTrajectories();
    this.clearZones();
    this.clearUtilities();
    this.clearVisionCones();
  }

  /**
   * Clear all players
   */
  clearPlayers(): void {
    this.playerMeshes.forEach((group, id) => {
      this.removePlayerPosition(id);
    });
  }

  /**
   * Get overlay statistics
   */
  getStats(): OverlayStats {
    return {
      playerCount: this.playerMeshes.size,
      activeTrajectories: this.trajectories.size,
      activeZones: this.zones.size,
      activeUtilities: this.utilities.size,
      drawCalls:
        this.playerMeshes.size +
        this.trajectories.size +
        this.zones.size +
        this.utilities.size +
        this.visionCones.size,
    };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.clearAll();

    // Dispose shared materials
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();

    // Dispose shared geometries
    this.geometries.forEach((geometry) => geometry.dispose());
    this.geometries.clear();
  }
}

export default TacticalOverlay3D;
