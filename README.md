# WonderPlay 3D

3D tools dev environment with Blender and Meshroom.
ok
## Quick Start

```bash
# Enter dev shell (Blender + tools)
nix-shell

# Download Meshroom (~14 GB)
./setup.sh

# Start Blender
blender

# Start Meshroom
./bin/meshroom

# CLI processing with Meshroom
./bin/meshroom_batch
```

## Tools

- **Blender** — 3D modeling, animation, rendering (Cycles/EEVEE)
- **Meshroom** — Photogrammetry 3D reconstruction from photos
- **Colmap** — Structure from Motion pipeline

## High-Quality Rendering

Blender's Cycles renderer provides physically-based path tracing comparable to Unreal Engine quality. Use:
- Cycles renderer with GPU acceleration
- HDRI lighting for realistic environments
- PBR materials with image textures
- Denoising for clean results

## File Structure

- `shell.nix` — Nix dev shell definition
- `setup.sh` — Downloads Meshroom binary into `vendor/`
- `bin/` — Wrapper scripts for Meshroom commands
- `vendor/` — Meshroom installation (gitignored)