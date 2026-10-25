# Drive Town 3D asset credits

## Road car

**AUDI Q3 SPORTBACK** by **simonovstepann37 / 3DCars4U**.

- [Creator and model](https://sketchfab.com/3d-models/audi-q3-sportback-a0159b9bee094c2d8f9b9d5694c94f45)
- [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
- [Original public GLB distribution in Objaverse](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-019/a0159b9bee094c2d8f9b9d5694c94f45.glb)

`assets/road-car.glb` adapts the project's existing licensed car kit: centred at ground level, rotated to +Z forward, reduced mesh detail, revised paint and glazing. Browser instances add coloured paint, yellow plates and indicator lamps. The original Blender asset stays untouched. Wheel meshes are static in this version.

This attribution follows the distributed asset's recorded author and license. Vehicle names and trademarks remain those of their owners.

## Walking pedestrians

**Animated Men Pack** by **Quaternius**, **CC0**.

- [Creator's pack page](https://quaternius.com/packs/animatedmen.html)
- [CC0 dedication](https://creativecommons.org/publicdomain/zero/1.0/)

`assets/pedestrian-walk.bin` and `.json` reuse the project's four-pose walking export of `Male_Casual.blend`. The browser converts coordinate axes, interpolates walking poses and recolours shirts. The source receipt identifies the February 2019 pack and its CC0 license.

## City cyclist

The human base mesh, skeleton and published weights are from **MakeHuman**, **CC0**. The bicycle, fitted garments, helmet and riding animation are locally authored in the project's accepted `cyclist-rigged.blend` asset.

- [MakeHuman project](https://www.makehumancommunity.org/)
- [CC0 dedication](https://creativecommons.org/publicdomain/zero/1.0/)

`assets/city-cyclist.glb` preserves the riding rig and samples its existing 0–120 frame cycle. Browser adaptation centres and rotates the complete model, omits subdivision detail, and advances its human cycle and cumulative wheel rotation with distance. It does not reuse the rejected printable-sculpt cyclist.

## Town and renderer

Buildings, vegetation, street furniture, signs, bus and train geometry are local scene artwork. The upgraded north street uses six roof variants, photographed surface maps and a bundled HDR sky. No remote texture or model downloads occur during play.

### Scanned materials and sky

The following **Poly Haven / CC0** assets are bundled locally:

- [Aerial Asphalt 01](https://polyhaven.com/a/aerial_asphalt_01), **Rob Tuytel**, 30 m tile.
- [Red Brick 03](https://polyhaven.com/a/red_brick_03), **Rob Tuytel**, 1 m tile.
- [Pavement 01](https://polyhaven.com/a/pavement_01), **Rob Tuytel**, 1.5 m tile.
- [Grey Roof 01](https://polyhaven.com/a/grey_roof_01), **Rob Tuytel**, 8 m tile.
- [Leafy Grass](https://polyhaven.com/a/leafy_grass), **Charlotte Baglioni**, 2 m tile.
- [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), **Greg Zaal / Jarod Guest**.

[Poly Haven license](https://polyhaven.com/license): CC0. The 1K diffuse, OpenGL normal and roughness JPEG maps were recompressed at quality 88. Material colours are tuned locally; physical tile widths set world-space UVs. The sky uses the original 1K Radiance HDR. Source URLs, byte sizes and hashes are recorded in `assets/surfaces/manifest.json`.

The bus is locally authored with shaped wheel openings, cab glass, split doors, ventilation, mirror arms, destination display and distance-driven wheel rotation. The train uses shaped cab ends, bogies and an accordion connection; both preserve their lesson positioning and signals.

Three.js 0.186.1 and its GLTFLoader, BufferGeometryUtils , SkeletonUtils and HDRLoader modules retain their MIT license in `vendor/THREE-LICENSE.txt`. Vendored import paths point to the local Three.js modules.

## Rebuilding browser assets

The scripts under `scripts/` run through Blender's Python runtime. Supply `--source` and `--output` after Blender's `--` separator. They read the existing project assets and export separate browser files; they never save over the source `.blend` files. See the export scripts for the explicit geometry and animation adaptations.

## Ambulance

The ambulance model of the game is drawn in code (`ambulance.js`) and has no asset file. Its colours follow the Dutch ambulance house style in a simple way. See "Ambulance livery" in `RULE-SOURCES.md` for the sources and for what the game does not copy.
