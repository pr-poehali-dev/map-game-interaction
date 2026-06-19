interface PixelSpriteProps {
  grid: string[];
  palette: Record<string, string>;
  size?: number;
  className?: string;
}

const PixelSprite = ({ grid, palette, size = 6, className = '' }: PixelSpriteProps) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return (
    <svg
      width={cols * size}
      height={rows * size}
      viewBox={`0 0 ${cols} ${rows}`}
      className={`pixelated ${className}`}
      shapeRendering="crispEdges"
    >
      {grid.map((row, y) =>
        row.split('').map((ch, x) => {
          const color = palette[ch];
          if (!color) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />;
        }),
      )}
    </svg>
  );
};

export default PixelSprite;
