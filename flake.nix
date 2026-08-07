{
  description = "WonderPlay 3D - Blender dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
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
          echo "   Blender:   $(blender --version 2>/dev/null | head -1 || echo 'ready')"
          echo "   Colmap:    $(colmap --version 2>/dev/null | head -1 || echo 'ready')"
          echo "  ========================================="
          echo "   Run 'blender' to start Blender"
          echo "   Run './setup.sh' to download Meshroom"
          echo "   Run './bin/meshroom' to start Meshroom"
          echo "  ========================================="
          echo ""
        '';
      };
    };
}