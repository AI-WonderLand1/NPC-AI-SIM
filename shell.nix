{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    blender
    colmap
    python3
    python3Packages.pip
    python3Packages.numpy
    python3Packages.opencv4
  ];

  shellHook = ''
    echo ""
    echo "  ========================================="
    echo "   WonderPlay 3D Dev Shell"
    echo "  ========================================="
    echo "   Blender:   $(blender --version 2>/dev/null | head -1)"
    echo "   Colmap:    $(colmap --version 2>/dev/null | head -1)"
    echo "  ========================================="
    echo "   Run 'blender' to start Blender"
    echo "   Run './setup.sh' to download Meshroom"
    echo "   Run './bin/meshroom' to start Meshroom"
    echo "  ========================================="
    echo ""
  '';
}