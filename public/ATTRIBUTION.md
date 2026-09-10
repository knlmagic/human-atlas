# Anatomy data attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International, except for the four historical meshes identified below.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## BodyParts3D 3.0 additions

The current BodyParts3D 4.0 archive omits latissimus dorsi and rectus abdominis. This project therefore includes four meshes from the official `BodyParts3D_3.0_obj_99.zip` release:

- `FMA13358`: right latissimus dorsi
- `FMA13359`: left latissimus dorsi
- `FMA13377`: right rectus abdominis
- `FMA13378`: left rectus abdominis

These four source meshes and their adaptations are licensed under [CC Attribution-ShareAlike 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en). The application source code remains MIT licensed; the ShareAlike terms apply to these anatomy-data derivatives.

- Official release: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/
- Archive SHA-256: `2125f6d761b14ead4ee64f71713f56f3f0f29982693ff20aac63474470cb92f4`
- Reproducible registration: `scripts/register-missing-muscles.py`
- Registration record and transformed source meshes: `assets/anatomy/bodyparts3d-3.0/registered/`

Adaptations: source axes and units converted from millimeters/Z-up to meters/Y-up; torso proportions registered to the 4.0 atlas with a piecewise-linear warp derived from shared hip, vertebral, sternal, scapular, and clavicular landmarks; geometry simplified; normals regenerated and quantized; and meshes packed into a separate binary atlas chunk. Source and output checksums, bounds, and landmark transforms are recorded in `registration.json`.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.
