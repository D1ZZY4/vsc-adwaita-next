# Nix: derivations, functions, let-in, with, attribute sets.
# Exercises: attribute sets, let-in bindings, functions, with, derivations,
# strings, interpolation, lists, conditionals, inherit.

{
  description = "VSC Adwaita Next, a GNOME Adwaita inspired VS Code theme";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        inherit (pkgs) lib stdenv;

        version = "1.0.0";

        pname = "vsc-adwaita-next";

        palette = {
          blue = "#3584e4";
          teal = "#5bc8af";
          orange = "#ffa348";
        };

        surfaces = [
          "view"
          "window"
          "sidebar"
          "dialog"
        ];

        classify = elevation:
          if elevation < 2 then
            "recessed"
          else if elevation == 3 then
            "overlay"
          else
            "chrome";

        mkSurface = name: elevation: {
          inherit name elevation;
          recessed = elevation < 2;
          kind = classify elevation;
        };

        allSurfaces = map (name: mkSurface name 0) surfaces;
      in
      {
        packages.default = stdenv.mkDerivation {
          inherit pname version;

          src = ./.;

          nativeBuildInputs = with pkgs; [ bun nodejs ];

          buildPhase = ''
            runHook preBuild
            bun install --frozen-lockfile
            bun run build
            bun run validate
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p $out/share/vscode/extensions/${pname}
            cp -r themes icons assets package.json $out/share/vscode/extensions/${pname}/
            runHook postInstall
          '';

          meta = with lib; {
            license = licenses.gpl3Only;
            platforms = platforms.linux ++ platforms.darwin;
          };
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [ bun nanoemoji ];
        };
      });
}
