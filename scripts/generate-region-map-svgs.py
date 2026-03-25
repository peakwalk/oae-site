#!/usr/bin/env python3
"""Generate smoother map-only SVG assets from the baked PNG region badges.

The source PNGs contain both the map silhouette and its label text. This script
extracts the map area by:
1. Upscaling and lightly blurring the source bitmap to recover smoother edges.
2. Thresholding the image and selecting the left-side connected components.
3. Filling enclosed holes, tracing continuous outer contours, then smoothing the
   resulting paths before exporting SVG.
"""

from __future__ import annotations

import math
import subprocess
from dataclasses import dataclass
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT_DIR / "src/assets/images/pages/home/regions"
OUTPUT_DIR = ROOT_DIR / "src/assets/images/pages/home/regions-svg"

UPSCALE_FACTOR = 12
PREPROCESS_ARGS = [
    "-alpha",
    "off",
    "-colorspace",
    "Gray",
    "-resize",
    f"{UPSCALE_FACTOR * 100}%",
    "-blur",
    "0x0.8",
    "-threshold",
    "92%",
    "-morphology",
    "Close",
    "Diamond:1",
    "-morphology",
    "Open",
    "Diamond:1",
]

SVG_COLOR = "#2F683E"
NOISE_COMPONENT_RATIO = 0.005
MIN_COMPONENT_AREA = UPSCALE_FACTOR * UPSCALE_FACTOR
SIMPLIFY_TOLERANCE = 5.0
POST_SMOOTH_SIMPLIFY_TOLERANCE = 2.0
CHAIKIN_ITERATIONS = 2
PADDING = UPSCALE_FACTOR

Point = tuple[float, float]
IntPoint = tuple[int, int]


@dataclass
class Component:
    pixels: list[IntPoint]
    min_x: int
    min_y: int
    max_x: int
    max_y: int

    @property
    def area(self) -> int:
        return len(self.pixels)

    @property
    def center_x(self) -> float:
        return (self.min_x + self.max_x) / 2


def load_binary_mask(image_path: Path) -> tuple[int, int, list[list[int]]]:
    result = subprocess.run(
        ["magick", str(image_path), *PREPROCESS_ARGS, "pbm:-"],
        check=True,
        capture_output=True,
    )
    data = result.stdout

    if not data.startswith(b"P4"):
        raise RuntimeError(f"Unexpected PBM payload for {image_path}")

    cursor = 2
    header_values: list[int] = []

    while len(header_values) < 2:
        while data[cursor : cursor + 1] in b" \t\r\n":
            cursor += 1
        if data[cursor : cursor + 1] == b"#":
            while data[cursor : cursor + 1] not in b"\n":
                cursor += 1
            continue
        end = cursor
        while data[end : end + 1] not in b" \t\r\n":
            end += 1
        header_values.append(int(data[cursor:end]))
        cursor = end

    width, height = header_values
    while data[cursor : cursor + 1] in b" \t\r\n":
        cursor += 1

    raster = data[cursor:]
    row_bytes = (width + 7) // 8
    mask = [[0 for _ in range(width)] for _ in range(height)]
    index = 0

    for y in range(height):
        row = raster[index : index + row_bytes]
        index += row_bytes
        x = 0
        for byte in row:
            for bit in range(7, -1, -1):
                if x >= width:
                    break
                mask[y][x] = (byte >> bit) & 1
                x += 1

    return width, height, mask


def find_components(mask: list[list[int]], diagonal: bool) -> list[Component]:
    height = len(mask)
    width = len(mask[0])
    seen = [[False for _ in range(width)] for _ in range(height)]

    if diagonal:
        neighbours = [
            (dx, dy)
            for dy in (-1, 0, 1)
            for dx in (-1, 0, 1)
            if dx or dy
        ]
    else:
        neighbours = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    components: list[Component] = []

    for y in range(height):
        for x in range(width):
            if seen[y][x] or not mask[y][x]:
                continue

            stack = [(x, y)]
            seen[y][x] = True
            pixels: list[IntPoint] = []
            min_x = max_x = x
            min_y = max_y = y

            while stack:
                cx, cy = stack.pop()
                pixels.append((cx, cy))
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)

                for dx, dy in neighbours:
                    nx = cx + dx
                    ny = cy + dy
                    if not (0 <= nx < width and 0 <= ny < height):
                        continue
                    if seen[ny][nx] or not mask[ny][nx]:
                        continue
                    seen[ny][nx] = True
                    stack.append((nx, ny))

            components.append(
                Component(
                    pixels=pixels,
                    min_x=min_x,
                    min_y=min_y,
                    max_x=max_x,
                    max_y=max_y,
                )
            )

    return components


def select_map_components(components: list[Component]) -> list[Component]:
    if not components:
        raise RuntimeError("No foreground components found")

    main_component = max(components, key=lambda component: component.area)
    cutoff_x = main_component.max_x

    return [
        component for component in components if component.center_x <= cutoff_x
    ]


def build_mask_from_components(
    width: int, height: int, components: list[Component]
) -> list[list[int]]:
    mask = [[0 for _ in range(width)] for _ in range(height)]
    for component in components:
        for x, y in component.pixels:
            mask[y][x] = 1
    return mask


def filter_noise_components(components: list[Component]) -> list[Component]:
    if not components:
        return []

    largest_area = max(component.area for component in components)
    minimum_area = max(int(largest_area * NOISE_COMPONENT_RATIO), MIN_COMPONENT_AREA)
    return [
        component for component in components if component.area >= minimum_area
    ]


def fill_component_holes(component: Component) -> Component:
    width = (component.max_x - component.min_x + 1) + 2
    height = (component.max_y - component.min_y + 1) + 2
    local_mask = [[0 for _ in range(width)] for _ in range(height)]

    for x, y in component.pixels:
        local_mask[y - component.min_y + 1][x - component.min_x + 1] = 1

    seen = [[False for _ in range(width)] for _ in range(height)]
    stack: list[IntPoint] = []

    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))

    while stack:
        x, y = stack.pop()
        if not (0 <= x < width and 0 <= y < height):
            continue
        if seen[y][x] or local_mask[y][x]:
            continue
        seen[y][x] = True
        stack.extend([(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)])

    pixels: list[IntPoint] = []

    for y in range(height):
        for x in range(width):
            if local_mask[y][x] or not seen[y][x]:
                pixels.append((x + component.min_x - 1, y + component.min_y - 1))

    min_x = min(x for x, _ in pixels)
    min_y = min(y for _, y in pixels)
    max_x = max(x for x, _ in pixels)
    max_y = max(y for _, y in pixels)

    return Component(
        pixels=pixels,
        min_x=min_x,
        min_y=min_y,
        max_x=max_x,
        max_y=max_y,
    )


def build_boundary_loops(component: Component) -> list[list[IntPoint]]:
    pixels = set(component.pixels)
    edges: dict[IntPoint, IntPoint] = {}

    for x, y in pixels:
        if (x, y - 1) not in pixels:
            edges[(x, y)] = (x + 1, y)
        if (x + 1, y) not in pixels:
            edges[(x + 1, y)] = (x + 1, y + 1)
        if (x, y + 1) not in pixels:
            edges[(x + 1, y + 1)] = (x, y + 1)
        if (x - 1, y) not in pixels:
            edges[(x, y + 1)] = (x, y)

    loops: list[list[IntPoint]] = []

    while edges:
        start = next(iter(edges))
        current = start
        loop = [start]

        while True:
            next_point = edges.pop(current)
            loop.append(next_point)
            current = next_point
            if current == start:
                break

        loops.append(loop[:-1])

    return loops


def remove_collinear_points(loop: list[Point]) -> list[Point]:
    if len(loop) < 3:
        return loop

    filtered: list[Point] = []
    length = len(loop)

    for index in range(length):
        previous_point = loop[index - 1]
        current_point = loop[index]
        next_point = loop[(index + 1) % length]

        if (
            previous_point[0] == current_point[0] == next_point[0]
            or previous_point[1] == current_point[1] == next_point[1]
        ):
            continue

        filtered.append(current_point)

    return filtered if filtered else loop


def perpendicular_distance(point: Point, start: Point, end: Point) -> float:
    if start == end:
        return math.dist(point, start)

    numerator = abs(
        (end[0] - start[0]) * (start[1] - point[1])
        - (start[0] - point[0]) * (end[1] - start[1])
    )
    denominator = math.dist(start, end)
    return numerator / denominator


def rdp(points: list[Point], tolerance: float) -> list[Point]:
    if len(points) <= 2:
        return points[:]

    start = points[0]
    end = points[-1]
    max_distance = -1.0
    split_index = 0

    for index in range(1, len(points) - 1):
        distance = perpendicular_distance(points[index], start, end)
        if distance > max_distance:
            max_distance = distance
            split_index = index

    if max_distance <= tolerance:
        return [start, end]

    left = rdp(points[: split_index + 1], tolerance)
    right = rdp(points[split_index:], tolerance)
    return left[:-1] + right


def simplify_closed_loop(loop: list[Point], tolerance: float) -> list[Point]:
    if len(loop) <= 4:
        return loop

    centroid_x = sum(x for x, _ in loop) / len(loop)
    centroid_y = sum(y for _, y in loop) / len(loop)

    start_index = max(
        range(len(loop)),
        key=lambda index: (loop[index][0] - centroid_x) ** 2
        + (loop[index][1] - centroid_y) ** 2,
    )
    rotated = loop[start_index:] + loop[:start_index]

    split_index = max(
        range(1, len(rotated)),
        key=lambda index: math.dist(rotated[0], rotated[index]),
    )

    first_half = rdp(rotated[: split_index + 1], tolerance)
    second_half = rdp(rotated[split_index:] + [rotated[0]], tolerance)

    simplified = first_half[:-1] + second_half[:-1]
    return simplified if len(simplified) >= 3 else loop


def chaikin(loop: list[Point], iterations: int) -> list[Point]:
    smoothed = loop[:]

    for _ in range(iterations):
        if len(smoothed) < 3:
            break

        next_loop: list[Point] = []
        for index in range(len(smoothed)):
            current = smoothed[index]
            following = smoothed[(index + 1) % len(smoothed)]
            q = (
                0.75 * current[0] + 0.25 * following[0],
                0.75 * current[1] + 0.25 * following[1],
            )
            r = (
                0.25 * current[0] + 0.75 * following[0],
                0.25 * current[1] + 0.75 * following[1],
            )
            next_loop.extend([q, r])

        smoothed = next_loop

    return smoothed


def smooth_loop(loop: list[IntPoint]) -> list[Point]:
    working: list[Point] = [(float(x), float(y)) for x, y in loop]
    working = remove_collinear_points(working)
    working = simplify_closed_loop(working, SIMPLIFY_TOLERANCE)
    working = chaikin(working, CHAIKIN_ITERATIONS)
    working = simplify_closed_loop(working, POST_SMOOTH_SIMPLIFY_TOLERANCE)
    return working


def compute_bbox(components: list[Component]) -> tuple[int, int, int, int]:
    return (
        min(component.min_x for component in components),
        min(component.min_y for component in components),
        max(component.max_x for component in components),
        max(component.max_y for component in components),
    )


def format_number(value: float) -> str:
    if abs(value - round(value)) < 1e-6:
        return str(int(round(value)))
    return f"{value:.3f}".rstrip("0").rstrip(".")


def normalise_point(point: Point, min_x: int, min_y: int) -> Point:
    shift_x = min_x - PADDING
    shift_y = min_y - PADDING
    return (
        (point[0] - shift_x) / UPSCALE_FACTOR,
        (point[1] - shift_y) / UPSCALE_FACTOR,
    )


def loop_to_path(loop: list[Point], min_x: int, min_y: int) -> str:
    normalised = [normalise_point(point, min_x, min_y) for point in loop]
    commands = [
        f"M {format_number(normalised[0][0])} {format_number(normalised[0][1])}"
    ]
    commands.extend(
        f"L {format_number(x)} {format_number(y)}" for x, y in normalised[1:]
    )
    commands.append("Z")
    return " ".join(commands)


def write_svg(
    output_path: Path,
    loops: list[list[Point]],
    bbox: tuple[int, int, int, int],
) -> None:
    min_x, min_y, max_x, max_y = bbox
    width = ((max_x - min_x + 1) + (PADDING * 2)) / UPSCALE_FACTOR
    height = ((max_y - min_y + 1) + (PADDING * 2)) / UPSCALE_FACTOR
    path_data = " ".join(loop_to_path(loop, min_x, min_y) for loop in loops)

    svg = "\n".join(
        [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            f'  viewBox="0 0 {format_number(width)} {format_number(height)}"',
            '  fill="none"',
            ">",
            f'  <path fill="{SVG_COLOR}" fill-rule="evenodd" d="{path_data}"/>',
            "</svg>",
            "",
        ]
    )
    output_path.write_text(svg, encoding="utf-8")


def generate_svg(image_path: Path) -> Path:
    width, height, binary_mask = load_binary_mask(image_path)
    map_seed_components = select_map_components(find_components(binary_mask, diagonal=True))
    selected_mask = build_mask_from_components(width, height, map_seed_components)

    contour_components = find_components(selected_mask, diagonal=False)
    contour_components = filter_noise_components(contour_components)
    contour_components = [fill_component_holes(component) for component in contour_components]

    loops: list[list[Point]] = []
    for component in contour_components:
        loops.extend(smooth_loop(loop) for loop in build_boundary_loops(component))

    bbox = compute_bbox(contour_components)
    output_path = OUTPUT_DIR / f"{image_path.stem}.svg"
    write_svg(output_path, loops, bbox)
    return output_path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = [generate_svg(image_path) for image_path in sorted(SOURCE_DIR.glob("*.png"))]
    for output_path in generated:
        print(output_path.relative_to(ROOT_DIR))


if __name__ == "__main__":
    main()
