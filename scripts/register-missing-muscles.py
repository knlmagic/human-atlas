"""Register missing BodyParts3D 3.0 muscles to the 4.0 atlas.

Usage:
    python3 scripts/register-missing-muscles.py /path/to/BodyParts3D_3.0_obj_99.zip

The two BodyParts3D releases use nearly identical axes but slightly different
torso proportions. This script derives a smooth, reproducible warp from shared
bony landmarks, applies it to four bilateral muscle meshes, and writes OBJ
files plus a provenance report. It intentionally uses only the Python standard
library so atlas maintenance does not depend on a scientific Python stack.
"""

from __future__ import annotations

import argparse
import bisect
import hashlib
import json
import logging
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


LOGGER = logging.getLogger("register-missing-muscles")
ROOT = Path(__file__).resolve().parents[1]
EXPECTED_ARCHIVE_SHA256 = (
    "2125f6d761b14ead4ee64f71713f56f3f0f29982693ff20aac63474470cb92f4"
)
MUSCLES = {
    "FMA13358": "Right latissimus dorsi",
    "FMA13359": "Left latissimus dorsi",
    "FMA13377": "Right rectus abdominis",
    "FMA13378": "Left rectus abdominis",
}
LANDMARK_GROUPS = [
    ("Hip bones", ("FMA16586", "FMA16587")),
    ("Fifth lumbar vertebra", ("FMA13076",)),
    ("Third lumbar vertebra", ("FMA13074",)),
    ("First lumbar vertebra", ("FMA13072",)),
    ("Twelfth thoracic vertebra", ("FMA10081",)),
    ("Tenth thoracic vertebra", ("FMA10037",)),
    ("Body of sternum", ("FMA7487",)),
    ("Scapulae", ("FMA13395", "FMA13396")),
    ("Clavicles", ("FMA13322", "FMA13323")),
]

Point = tuple[float, float, float]
Bounds = tuple[Point, Point]


@dataclass(frozen=True)
class Mesh:
    """A minimal Wavefront OBJ mesh."""

    vertices: list[Point]
    faces: list[list[int]]


@dataclass(frozen=True)
class WarpAnchor:
    """One torso-height sample of the source-to-target coordinate warp."""

    name: str
    source_y: float
    target_y: float
    x_scale: float
    x_offset: float
    z_scale: float
    z_offset: float


def sha256_bytes(data: bytes) -> str:
    """Return a lowercase SHA-256 digest."""

    return hashlib.sha256(data).hexdigest()


def convert_source_point(point: Point) -> Point:
    """Convert BodyParts3D millimetres/Z-up into atlas metres/Y-up."""

    x_value, y_value, z_value = point
    return (
        x_value * 0.001,
        z_value * 0.001 + 0.0781112,
        -y_value * 0.001 - 0.1,
    )


def parse_obj(data: bytes) -> Mesh:
    """Parse vertices and polygon faces from a BodyParts3D OBJ file."""

    vertices: list[Point] = []
    faces: list[list[int]] = []
    for raw_line in data.decode("utf-8").splitlines():
        if raw_line.startswith("v "):
            values = raw_line.split()
            vertices.append(convert_source_point(tuple(map(float, values[1:4]))))
        elif raw_line.startswith("f "):
            face = [int(value.split("/")[0]) for value in raw_line.split()[1:]]
            if len(face) >= 3:
                faces.append(face)
    if not vertices or not faces:
        raise ValueError("OBJ has no usable vertices or faces")
    return Mesh(vertices, faces)


def mesh_bounds(vertices: Iterable[Point]) -> Bounds:
    """Calculate an axis-aligned bounding box."""

    points = list(vertices)
    if not points:
        raise ValueError("Cannot calculate bounds for an empty point set")
    return (
        tuple(min(point[axis] for point in points) for axis in range(3)),
        tuple(max(point[axis] for point in points) for axis in range(3)),
    )


def combine_bounds(bounds: Iterable[Bounds]) -> Bounds:
    """Combine multiple axis-aligned bounding boxes."""

    boxes = list(bounds)
    if not boxes:
        raise ValueError("Cannot combine an empty bounds list")
    return (
        tuple(min(box[0][axis] for box in boxes) for axis in range(3)),
        tuple(max(box[1][axis] for box in boxes) for axis in range(3)),
    )


def center(bounds: Bounds, axis: int) -> float:
    """Return a bounds centre on one axis."""

    return (bounds[0][axis] + bounds[1][axis]) / 2


def extent(bounds: Bounds, axis: int) -> float:
    """Return a bounds extent on one axis."""

    return bounds[1][axis] - bounds[0][axis]


def archive_files(archive_path: Path, identifiers: set[str]) -> dict[str, bytes]:
    """Read selected OBJ files regardless of ZIP path separator style."""

    results: dict[str, bytes] = {}
    with zipfile.ZipFile(archive_path) as archive:
        for item in archive.infolist():
            filename = item.filename.replace("\\", "/").split("/")[-1]
            identifier = filename.removesuffix(".obj")
            if filename.endswith(".obj") and identifier in identifiers:
                results[identifier] = archive.read(item)
    missing = identifiers - results.keys()
    if missing:
        raise ValueError(f"Archive is missing required OBJ files: {sorted(missing)}")
    return results


def target_bounds_by_concept(atlas: dict) -> dict[str, Bounds]:
    """Index current atlas part bounds by FMA concept identifier."""

    indexed: dict[str, list[Bounds]] = {}
    for part in atlas["parts"]:
        bounds = (tuple(part["bounds"][0]), tuple(part["bounds"][1]))
        indexed.setdefault(part["conceptId"], []).append(bounds)
    return {
        concept_id: combine_bounds(part_bounds)
        for concept_id, part_bounds in indexed.items()
    }


def build_anchors(
    source_meshes: dict[str, Mesh],
    target_bounds: dict[str, Bounds],
) -> list[WarpAnchor]:
    """Derive smooth axis scale/offset samples from matching bony structures."""

    anchors: list[WarpAnchor] = []
    for name, concept_ids in LANDMARK_GROUPS:
        source = combine_bounds(
            mesh_bounds(source_meshes[concept_id].vertices)
            for concept_id in concept_ids
        )
        try:
            target = combine_bounds(
                target_bounds[concept_id] for concept_id in concept_ids
            )
        except KeyError as error:
            message = f"Current atlas is missing landmark {error.args[0]}"
            raise ValueError(message) from error

        source_x_extent = extent(source, 0)
        source_z_extent = extent(source, 2)
        if source_x_extent <= 0 or source_z_extent <= 0:
            raise ValueError(f"Landmark {name} has invalid source bounds")
        x_scale = extent(target, 0) / source_x_extent
        z_scale = extent(target, 2) / source_z_extent
        anchors.append(
            WarpAnchor(
                name=name,
                source_y=center(source, 1),
                target_y=center(target, 1),
                x_scale=x_scale,
                x_offset=center(target, 0) - center(source, 0) * x_scale,
                z_scale=z_scale,
                z_offset=center(target, 2) - center(source, 2) * z_scale,
            )
        )
        if name == "Hip bones":
            # Rectus abdominis extends below the hip-bone centre. Add a lower
            # endpoint so those vertices follow the pelvis instead of being
            # clamped and flattened at the first centre anchor.
            anchors.append(
                WarpAnchor(
                    name="Lower pelvis",
                    source_y=source[0][1],
                    target_y=target[0][1],
                    x_scale=x_scale,
                    x_offset=center(target, 0) - center(source, 0) * x_scale,
                    z_scale=z_scale,
                    z_offset=center(target, 2) - center(source, 2) * z_scale,
                )
            )
    return sorted(anchors, key=lambda anchor: anchor.source_y)


def interpolate(anchors: list[WarpAnchor], source_y: float, field: str) -> float:
    """Linearly interpolate one warp field, clamping beyond the landmarks."""

    heights = [anchor.source_y for anchor in anchors]
    values = [getattr(anchor, field) for anchor in anchors]
    upper = bisect.bisect_left(heights, source_y)
    if upper == 0:
        return values[0]
    if upper == len(anchors):
        return values[-1]
    lower = upper - 1
    span = heights[upper] - heights[lower]
    amount = 0.0 if span == 0 else (source_y - heights[lower]) / span
    return values[lower] + (values[upper] - values[lower]) * amount


def warp_mesh(mesh: Mesh, anchors: list[WarpAnchor]) -> Mesh:
    """Apply the landmark-derived torso warp while preserving mesh topology."""

    vertices: list[Point] = []
    for x_value, y_value, z_value in mesh.vertices:
        x_scale = interpolate(anchors, y_value, "x_scale")
        x_offset = interpolate(anchors, y_value, "x_offset")
        z_scale = interpolate(anchors, y_value, "z_scale")
        z_offset = interpolate(anchors, y_value, "z_offset")
        vertices.append(
            (
                x_value * x_scale + x_offset,
                interpolate(anchors, y_value, "target_y"),
                z_value * z_scale + z_offset,
            )
        )
    return Mesh(vertices, mesh.faces)


def serialize_obj(identifier: str, name: str, mesh: Mesh) -> bytes:
    """Serialize a registered mesh as a deterministic Wavefront OBJ."""

    lines = [
        f"# BodyParts3D 3.0 source : {identifier}.obj",
        f"# English name : {name}",
        "# Registered to the BodyParts3D 4.0 atlas by shared bony landmarks",
    ]
    lines.extend(
        f"v {x_value:.9f} {y_value:.9f} {z_value:.9f}"
        for x_value, y_value, z_value in mesh.vertices
    )
    lines.extend(f"f {' '.join(map(str, face))}" for face in mesh.faces)
    return ("\n".join(lines) + "\n").encode("utf-8")


def main() -> int:
    """Run registration and write transformed meshes plus provenance."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="Official 3.0 obj_99 ZIP archive")
    parser.add_argument(
        "--atlas",
        type=Path,
        default=ROOT / "public/models/atlas.json",
        help="Current atlas manifest",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "assets/anatomy/bodyparts3d-3.0/registered",
        help="Directory for transformed OBJ files and registration report",
    )
    args = parser.parse_args()

    if not args.archive.is_file():
        parser.error(f"Archive does not exist: {args.archive}")
    archive_digest = sha256_bytes(args.archive.read_bytes())
    if archive_digest != EXPECTED_ARCHIVE_SHA256:
        parser.error(
            "Archive checksum does not match the official BodyParts3D 3.0 "
            f"obj_99 release: {archive_digest}"
        )

    try:
        atlas = json.loads(args.atlas.read_text(encoding="utf-8"))
        required_ids = set(MUSCLES)
        required_ids.update(
            concept_id
            for _, concept_ids in LANDMARK_GROUPS
            for concept_id in concept_ids
        )
        source_files = archive_files(args.archive, required_ids)
        source_meshes = {
            identifier: parse_obj(data) for identifier, data in source_files.items()
        }
        anchors = build_anchors(source_meshes, target_bounds_by_concept(atlas))
        args.output.mkdir(parents=True, exist_ok=True)

        outputs = []
        for identifier, name in MUSCLES.items():
            transformed = warp_mesh(source_meshes[identifier], anchors)
            output_data = serialize_obj(identifier, name, transformed)
            output_path = args.output / f"{identifier}.obj"
            output_path.write_bytes(output_data)
            outputs.append(
                {
                    "id": identifier,
                    "name": name,
                    "sourceSha256": sha256_bytes(source_files[identifier]),
                    "outputSha256": sha256_bytes(output_data),
                    "vertexCount": len(transformed.vertices),
                    "faceCount": len(transformed.faces),
                    "sourceBounds": mesh_bounds(source_meshes[identifier].vertices),
                    "registeredBounds": mesh_bounds(transformed.vertices),
                }
            )
            LOGGER.info("Registered %s to %s", name, output_path)

        report = {
            "source": {
                "dataset": "BodyParts3D 3.0 obj_99",
                "archive": args.archive.name,
                "archiveSha256": archive_digest,
                "license": "CC BY-SA 2.1 Japan",
            },
            "target": {
                "dataset": atlas.get("version", "BodyParts3D 4.0"),
                "atlas": args.atlas.name,
            },
            "method": (
                "Piecewise-linear torso warp derived from matching bilateral "
                "and midline bony landmark bounds"
            ),
            "anchors": [anchor.__dict__ for anchor in anchors],
            "outputs": outputs,
        }
        report_path = args.output / "registration.json"
        report_path.write_text(
            json.dumps(report, indent=2) + "\n",
            encoding="utf-8",
        )
        LOGGER.info("Wrote registration provenance to %s", report_path)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        LOGGER.error("Registration failed: %s", error)
        return 1
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    sys.exit(main())
